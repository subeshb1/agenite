import { BaseLLMConfig, ToolDefinition } from "@agenite/llm";

/**
 * Available GPT model versions
 */
export type OpenAIModel =
  | "gpt-4-turbo-preview"
  | "gpt-4-0125-preview"
  | "gpt-4-1106-preview"
  | "gpt-4"
  | "gpt-4-32k"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k";

/**
 * OpenAI-specific configuration options
 */
export interface OpenAIConfig extends BaseLLMConfig {
  apiKey: string;
  model?: OpenAIModel;
  /**
   * Response format for completions
   */
  responseFormat?: "text" | "json_object";
  /**
   * Tool definitions in OpenAI format
   */
  tools?: ToolDefinition[];
  /**
   * Forces the model to use a specific tool
   */
  forceTool?: string;
  /**
   * System prompt to be prepended to all messages
   */
  systemPrompt?: string;
}
