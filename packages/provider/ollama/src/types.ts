import { BaseLLMConfig, ToolDefinition } from '@agenite/llm';

/**
 * Available Ollama model types
 */
export type OllamaModel =
  | 'llama3.2'
  | 'llama2'
  | 'codellama'
  | 'mistral'
  | 'mixtral'
  | 'phi'
  | 'neural-chat'
  | 'starling-lm'
  | 'openchat'
  | 'dolphin-phi'
  | 'stable-beluga'
  | (string & {}); // Allow custom models

/**
 * Ollama-specific configuration options
 */
export interface OllamaConfig extends BaseLLMConfig {
  model: OllamaModel;
  /**
   * Host URL for Ollama server
   */
  host?: string;
  /**
   * System prompt to be prepended to all messages
   */
  systemPrompt?: string;
  /**
   * Tool definitions in Ollama format
   */
  tools?: ToolDefinition[];
  /**
   * Default temperature for generation
   */
  temperature?: number;
  /**
   * Default maximum tokens for generation
   */
  maxTokens?: number;
  /**
   * Additional model parameters
   * @see https://github.com/ollama/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values
   */
  parameters?: {
    mirostat?: number;
    mirostat_eta?: number;
    mirostat_tau?: number;
    num_ctx?: number;
    num_gqa?: number;
    num_gpu?: number;
    num_thread?: number;
    repeat_last_n?: number;
    repeat_penalty?: number;
    temperature?: number;
    tfs_z?: number;
    top_k?: number;
    top_p?: number;
  };
}
