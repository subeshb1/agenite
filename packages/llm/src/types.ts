/**
 * Content block types for rich message content
 */
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ToolUseBlock
  | ToolResultBlock
  | ReasoningBlock;

export interface ReasoningBlock {
  type: 'reasoning';
  reasoning: string;
  [key: string]: unknown;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export interface ToolUseBlock {
  type: 'toolUse';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: 'toolResult';
  toolUseId: string;
  toolName: string;
  content?: string | Array<TextBlock | ImageBlock>;
  isError?: boolean;
}

/**
 * Message role types
 */
export type Role = 'user' | 'assistant' | 'system';

/**
 * Base message interface
 */
export interface BaseMessage {
  role: Role;
  content: ContentBlock[];
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  modelId: string;
}

/**
 * Stop reasons for generation
 */
export type StopReason = 'toolUse' | 'maxTokens' | 'stopSequence' | 'endTurn';

/**
 * Response from generation
 */
export interface GenerateResponse {
  content: Array<ContentBlock>;
  tokens: TokenUsage[];
  duration: number;
  stopReason?: StopReason;
}

/**
 * Base configuration for any LLM provider
 */
export interface BaseLLMConfig {
  organization?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
}

export type PartialReturn =
  | { type: 'text'; text: string; isStart?: boolean; isEnd?: boolean }
  | { type: 'reasoning'; reasoning: string; isStart?: boolean; isEnd?: boolean }
  | {
      type: 'toolUse';
      toolUse: ToolUseBlock;
      isStart?: boolean;
      isEnd?: boolean;
    };

/**
 * Options for generation
 */
export interface GenerateOptions {
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

/**
 * Options for iterate method
 */
export interface IterateGenerateOptions extends GenerateOptions {
  stream: boolean;
}

/**
 * Core LLM provider interface
 */
export interface LLMProvider {
  name: string;
  version?: string;

  /**
   * Simple text generation with full response
   */
  generate(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse>;

  /**
   * Simple streaming with partial returns
   */
  stream(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown>;

  /**
   * Low-level generation API with full control
   */
  iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolSchema;
}

export interface ToolSchema {
  type: 'object';
  properties?: unknown | null;
  [k: string]: unknown;
}
