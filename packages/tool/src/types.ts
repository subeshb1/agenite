import { z } from 'zod';
import { TokenUsage, ToolDefinition } from '@agenite/llm';

export interface Tool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  readonly inputSchema?: ToolDefinition['inputSchema'];

  execute(params: ToolExecuteParams<TInput>): Promise<ToolResponse>;
  validate?(input: TInput): Promise<ValidationResult>;
}

export type SchemaType<T> = z.ZodType<T> | JSONSchema;

export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [k: string]: unknown;
}

export interface ToolOptions<TInput> {
  name: string;
  description: string;
  version?: string;
  inputSchema?: SchemaType<TInput>;
  execute: (params: ToolExecuteParams<TInput>) => Promise<ToolResponse>;
  validate?: (input: TInput) => Promise<ValidationResult>;
}

export interface ToolExecuteParams<TInput> {
  input: TInput;
  context?: ToolContext;
}

export interface ToolContext {
  agentId?: string;
  executionId?: string;
  parentToolExecutionId?: string;
  extraContext?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type ToolResponseData = string | Array<ToolResponseBlock>;

export interface ToolResponseBlock {
  type: 'text' | 'image';
  text?: string;
  image?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface ToolResponse {
  isError: boolean;
  data: ToolResponseData;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  duration?: number;
  tokenUsage?: TokenUsage;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
