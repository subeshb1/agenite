import { z } from 'zod';
import {
  Tool,
  ToolContext,
  ToolResponse,
  ValidationResult,
  JSONSchema,
} from '../agent/types';
import zodToJsonSchema from 'zod-to-json-schema';

export type SchemaType<T> = z.ZodType<T> | JSONSchema;

export interface ToolFactoryConfig<TInput> {
  name: string;
  description: string;
  inputSchema: SchemaType<TInput>;
  execute: (params: {
    input: TInput;
    context?: ToolContext;
  }) => Promise<ToolResponse>;
}

export function createTool<TInput>({
  name,
  description,
  inputSchema,
  execute,
}: ToolFactoryConfig<TInput>): Tool<TInput> {
  const isZodSchema = (
    schema: SchemaType<unknown>,
  ): schema is z.ZodType<unknown> => {
    return schema instanceof z.ZodType;
  };

  // Get the JSON Schema representation for LLM consumption
  const llmSchema = isZodSchema(inputSchema)
    ? (() => {
        const { $schema: _, ...values } = zodToJsonSchema(inputSchema, {});
        return values as unknown as JSONSchema;
      })()
    : inputSchema;

  // Validate using JSON Schema
  const validateJsonSchema = async (
    schema: JSONSchema,
    input: unknown,
  ): Promise<ValidationResult> => {
    try {
      // Dynamically import Ajv only when needed
      const { default: Ajv } = await import('ajv');
      const ajv = new Ajv();
      const validate = ajv.compile(schema);
      const valid = validate(input);

      if (!valid) {
        return {
          isValid: false,
          errors: validate.errors?.map((error) => ({
            field: error.instancePath.slice(1) || 'unknown',
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
            field: 'unknown',
            message:
              error instanceof Error ? error.message : 'Validation failed',
          },
        ],
      };
    }
  };

  return {
    name,
    description,
    inputSchema: llmSchema,
    executableType: 'tool',

    async execute({ input, context }) {
      try {
        // Validate input before execution
        const validationResult = await this.validate?.(input);
        if (validationResult && !validationResult.isValid) {
          return {
            success: false,
            data: `Validation failed: ${validationResult.errors
              ?.map((e) => e.message)
              .join(', ')}`,
          };
        }

        const startTime = Date.now();
        const result = await execute({ input, context });
        const duration = Date.now() - startTime;

        return {
          ...result,
          duration,
        };
      } catch (error) {
        return {
          success: false,
          data:
            error instanceof Error
              ? `${error.message}`
              : 'Tool execution failed',
          duration: 0,
        };
      }
    },

    async validate(input: TInput): Promise<ValidationResult> {
      try {
        if (isZodSchema(inputSchema)) {
          inputSchema.parse(input);
          return { isValid: true };
        } else {
          return validateJsonSchema(inputSchema, input);
        }
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
        return {
          isValid: false,
          errors: [
            {
              field: 'unknown',
              message: 'Validation failed',
            },
          ],
        };
      }
    },
  };
}
