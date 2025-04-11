/**
 * Content block types for rich message content
 */
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ToolUseBlock
  | ToolResultBlock
  | DocumentBlock
  | ThinkingBlock
  | RedactedThinkingBlock;

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
  [key: string]: unknown;
}

export interface RedactedThinkingBlock {
  type: 'redactedThinking';
  redactedThinking: string;
  [key: string]: unknown;
}

export interface DocumentBlock {
  source: {
    [key: string]: unknown;
  };

  type: 'document';

  [key: string]: unknown;
}

export interface TextBlock {
  type: 'text';
  text: string;
  [key: string]: unknown;
}

export interface ImageBlock {
  type: 'image';
  source:
    | {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
      }
    | { type: 'url'; url: string };
  [key: string]: unknown;
}

export interface ToolUseBlock {
  type: 'toolUse';
  id: string;
  name: string;
  input: unknown;
  [key: string]: unknown;
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
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;

  inputCost: number;
  outputCost: number;

  model: string;
};

/**
 * Stop reasons for generation
 */
export type StopReason = 'toolUse' | 'maxTokens' | 'stopSequence' | 'endTurn';

/**
 * Response from generation
 */
export interface GenerateResponse {
  content: Array<ContentBlock>;
  tokenUsage: TokenUsage;
  stopReason?: StopReason;
}

/**
 * Base configuration for any LLM provider to use for the provider
 * This maintains consistency across all providers, although some providers may not use all of these options
 */
export interface BaseLLMConfig {
  /**
   * Model ID to use for the provider
   */
  model?: string;
  /**
   * Whether to enable thinking
   */
  enableThinking?: boolean;
  /**
   * Base URL for the provider
   */
  baseURL?: string;
}

/**
 * Partial return type for streaming
 */
export type PartialReturn =
  /**
   * Text block
   * isStart and isEnd are used to determine if the text is the start or end of the response
   */
  | { type: 'text'; text: string; isStart?: boolean; isEnd?: boolean }
  /**
   * Thinking block
   * isStart and isEnd are used to determine if the thinking is the start or end of the response
   */
  | { type: 'thinking'; thinking: string; isStart?: boolean; isEnd?: boolean }
  /**
   * Tool use block
   * isStart and isEnd are used to determine if the tool use is the start or end of the response
   * toolUseInputString as string until the tool call is complete
   */
  | {
      type: 'toolUse';
      toolUseInputString?: string;
      toolUse?: ToolUseBlock;
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
