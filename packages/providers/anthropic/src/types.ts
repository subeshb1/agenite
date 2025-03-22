import { BaseLLMConfig, ToolDefinition } from "@agenite/llm";

/**
 * Available Claude model versions
 */
export type AnthropicModel =
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240229"
  | "claude-2.1"
  | "claude-2.0"
  | "claude-instant-1.2";

/**
 * Anthropic-specific configuration options
 */
export interface AnthropicConfig extends BaseLLMConfig {
  apiKey: string;
  model?: AnthropicModel;
  /**
   * System prompt to be prepended to all messages
   */
  systemPrompt?: string;
  /**
   * Tool definitions in Anthropic format
   */
  tools?: ToolDefinition[];
  /**
   * Additional metadata for requests
   */
  metadata?: Record<string, unknown>;
  /**
   * Maximum number of retries for failed requests
   */
  maxRetries?: number;
}
