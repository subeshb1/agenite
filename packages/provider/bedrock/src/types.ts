import { BaseLLMConfig } from '@agenite/llm';

/**
 * Bedrock Tool type
 */
export interface BedrockTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Available Bedrock model types
 */
export type BedrockModel =
  | 'anthropic.claude-3-sonnet-20240229-v1:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  | 'anthropic.claude-v2:1'
  | 'anthropic.claude-instant-v1'
  | 'amazon.titan-text-express-v1'
  | 'amazon.titan-text-lite-v1'
  | 'meta.llama2-70b-chat-v1'
  | 'meta.llama2-13b-chat-v1'
  | (string & {}); // Allow custom models

/**
 * Bedrock-specific configuration options
 */
export interface BedrockConfig extends BaseLLMConfig {
  /**
   * AWS Region for Bedrock service
   * @default us-west-2
   */
  region?: string;

  /**
   * Model ID to use
   * @default anthropic.claude-3-sonnet-20240229-v1:0
   */
  model: BedrockModel;

  /**
   * Default temperature for generation
   */
  temperature?: number;

  /**
   * Default maximum tokens for generation
   */
  maxTokens?: number;

  /**
   * AWS credentials configuration
   */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

export type BedrockStopReason =
  | 'max_tokens'
  | 'stop_sequence'
  | 'end_turn'
  | 'tool_use'
  | 'content_filtered'
  | 'guardrail_intervened'
  | null;
