import { DetailedTokenUsage } from './agent';
import { ToolResultBlock } from './message';

export interface Tool<TInput = unknown> extends ToolDefinition {
  version?: string;
  executableType?: 'tool';

  execute(params: {
    input: TInput;
    context?: ToolContext;
  }): Promise<ToolResponse>;

  validate?(input: TInput): Promise<ValidationResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: ToolSchema;
}

export interface ToolSchema {
  type: 'object';
  properties?: unknown | null;
  [k: string]: unknown;
}

export interface ToolContext {
  agentId: string;
  executionId: string;
  parentToolExecutionId?: string;
  extraContext?: Record<string, unknown>;
}

export interface ToolResponse {
  success: boolean;
  data: ToolResultBlock['content'];
  duration?: number;
  tokenUsage?: DetailedTokenUsage;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ToolConfig<TInput> {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: TInput, context?: ToolContext) => Promise<ToolResponse>;
  validate?: (input: TInput) => Promise<ValidationResult>;
}
