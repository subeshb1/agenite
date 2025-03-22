import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import type { ErrorObject } from 'ajv';
import { ToolDefinition } from '@agenite/llm';
import {
  Tool as ToolInterface,
  ToolOptions,
  ToolExecuteParams,
  ToolResponse,
  ValidationResult,
  JSONSchema,
} from './types';

type ToolSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
};

export class Tool<TInput = unknown> implements ToolInterface<TInput> {
  public readonly name: string;
  public readonly description: string;
  public readonly version?: string;
  public readonly inputSchema?: ToolDefinition['inputSchema'];

  private readonly executeImpl: (
    params: ToolExecuteParams<TInput>
  ) => Promise<ToolResponse>;
  private readonly validateImpl?: (input: TInput) => Promise<ValidationResult>;
  private readonly zodSchema?: z.ZodType<TInput>;
  private readonly jsonSchema?: JSONSchema;

  constructor(options: ToolOptions<TInput>) {
    this.name = options.name;
    this.description = options.description;
    this.version = options.version;
    this.executeImpl = options.execute;
    this.validateImpl = options.validate;

    // Handle input schema
    if (options.inputSchema) {
      if (options.inputSchema instanceof z.ZodType) {
        this.zodSchema = options.inputSchema;
        const { $schema: _, ...schema } = zodToJsonSchema(
          options.inputSchema,
          {}
        );
        this.jsonSchema = schema as JSONSchema;
        this.inputSchema = this.createToolSchema(schema as JSONSchema);
      } else {
        this.jsonSchema = options.inputSchema;
        this.inputSchema = this.createToolSchema(options.inputSchema);
      }
    }
  }

  private createToolSchema(schema: JSONSchema): ToolSchema {
    return {
      type: 'object',
      properties: schema.properties || {},
      required: schema.required,
    };
  }

  public async execute(
    params: ToolExecuteParams<TInput>
  ): Promise<ToolResponse> {
    try {
      // Validate input if schema or validator is provided
      if (this.validateImpl || this.jsonSchema) {
        const validationResult = await this.validate(params.input);
        if (!validationResult.isValid) {
          return {
            isError: true,
            data: `Validation failed: ${validationResult.errors?.map((e) => e.message).join(', ')}`,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Input validation failed',
              details: validationResult.errors,
            },
          };
        }
      }

      // Track execution time
      const startTime = Date.now();

      // Execute the tool
      const response = await this.executeImpl(params);

      // Add duration if not provided
      if (!response.duration) {
        response.duration = Date.now() - startTime;
      }

      return response;
    } catch (error) {
      // Handle execution errors
      return {
        isError: true,
        data: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          details: error,
        },
      };
    }
  }

  public async validate(input: TInput): Promise<ValidationResult> {
    try {
      // Use custom validator if provided
      if (this.validateImpl) {
        return await this.validateImpl(input);
      }

      // Use Zod schema if available
      if (this.zodSchema) {
        try {
          this.zodSchema.parse(input);
          return { isValid: true };
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              isValid: false,
              errors: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            };
          }
        }
      }

      // Use JSON Schema validation if provided
      if (this.jsonSchema) {
        return this.validateJsonSchema(input);
      }

      // No validation needed
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: '*',
            message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async validateJsonSchema(input: TInput): Promise<ValidationResult> {
    try {
      const { default: Ajv } = await import('ajv');
      const ajv = new Ajv();
      const validate = ajv.compile(this.jsonSchema!);
      const valid = validate(input);

      if (!valid) {
        return {
          isValid: false,
          errors: validate.errors?.map((error: ErrorObject) => ({
            field: error.instancePath.slice(1) || '*',
            message: error.message || 'Validation failed',
          })),
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: '*',
            message:
              error instanceof Error ? error.message : 'Validation failed',
          },
        ],
      };
    }
  }
}
