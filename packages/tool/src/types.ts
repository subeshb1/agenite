import { TokenUsage, BaseMessage } from '@agenite/llm';

export interface Tool<TInput = unknown> {
  name: string;
  description: string;
  version?: string;
  executableType?: 'tool';
  inputSchema?: ToolSchema;

  execute(params: {
    input: TInput;
    context?: ToolContext;
  }): Promise<ToolResponse>;

  validate?(input: TInput): Promise<ValidationResult>;
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
  data: string | Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }>;
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

export interface ToolConfig<TInput> {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: TInput, context?: ToolContext) => Promise<ToolResponse>;
  validate?: (input: TInput) => Promise<ValidationResult>;
} 
