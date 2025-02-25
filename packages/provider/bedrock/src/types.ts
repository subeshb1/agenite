import { BaseLLMConfig } from '@agenite/llm';
import {
  BedrockRuntimeClientConfig,
  ConverseCommandInput,
  ConverseStreamCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

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
  | 'ai21.jamba-1-5-large-v1:0'
  | 'ai21.jamba-1-5-mini-v1:0'
  | 'amazon.nova-canvas-v1:0'
  | 'amazon.nova-lite-v1:0'
  | 'amazon.nova-micro-v1:0'
  | 'amazon.nova-pro-v1:0'
  | 'amazon.nova-reel-v1:0'
  | 'amazon.rerank-v1:0'
  | 'amazon.titan-embed-text-v1'
  | 'amazon.titan-image-generator-v2:0'
  | 'amazon.titan-image-generator-v1'
  | 'amazon.titan-embed-image-v1'
  | 'amazon.titan-embed-text-v2:0'
  | 'amazon.titan-text-express-v1'
  | 'amazon.titan-text-lite-v1'
  | 'amazon.titan-text-premier-v1:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  | 'anthropic.claude-3-opus-20240229-v1:0'
  | 'anthropic.claude-3-sonnet-20240229-v1:0'
  | 'anthropic.claude-3-5-haiku-20241022-v1:0'
  | 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  | 'anthropic.claude-3-5-sonnet-20240620-v1:0'
  | 'anthropic.claude-3-7-sonnet-20250219-v1:0'
  | 'cohere.command-light-text-v14'
  | 'cohere.command-r-plus-v1:0'
  | 'cohere.command-r-v1:0'
  | 'cohere.command-text-v14'
  | 'cohere.embed-english-v3'
  | 'cohere.embed-multilingual-v3'
  | 'cohere.rerank-v3-5:0'
  | 'luma.ray-v2:0'
  | 'meta.llama3-8b-instruct-v1:0'
  | 'meta.llama3-70b-instruct-v1:0'
  | 'meta.llama3-1-8b-instruct-v1:0'
  | 'meta.llama3-1-70b-instruct-v1:0'
  | 'meta.llama3-1-405b-instruct-v1:0'
  | 'meta.llama3-2-1b-instruct-v1:0'
  | 'meta.llama3-2-3b-instruct-v1:0'
  | 'meta.llama3-2-11b-instruct-v1:0'
  | 'meta.llama3-2-90b-instruct-v1:0'
  | 'meta.llama3-3-70b-instruct-v1:0'
  | 'mistral.mistral-7b-instruct-v0:2'
  | 'mistral.mistral-large-2402-v1:0'
  | 'mistral.mistral-large-2407-v1:0'
  | 'mistral.mistral-small-2402-v1:0'
  | 'mistral.mixtral-8x7b-instruct-v0:1'
  | 'stability.sd3-5-large-v1:0'
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
  model?: BedrockModel;

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
  bedrockClientConfig?: Partial<BedrockRuntimeClientConfig>;
  converseCommandConfig?: Partial<ConverseCommandInput> | Partial<ConverseStreamCommandInput>[];
  enableReasoning?: boolean;
  reasoningBudgetTokens?: number;
}

export type BedrockStopReason =
  | 'max_tokens'
  | 'stop_sequence'
  | 'end_turn'
  | 'tool_use'
  | 'content_filtered'
  | 'guardrail_intervened'
  | null;
