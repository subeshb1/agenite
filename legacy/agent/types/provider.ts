import { StopReason, TokenUsage } from './agent';
import { BaseMessage, ContentBlock } from './message';
import { Tool, ToolDefinition } from './tool';

export interface LLMProvider {
  name: string;
  version?: string;

  generate(params: {
    messages: BaseMessage[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    systemPrompt?: string;
    extraContext?: Record<string, unknown>;
    stream?: boolean;
  }): AsyncGenerator<
    { type: 'partial'; content: [{ type: 'text'; text: string }] },
    GenerateResponse,
    unknown
  >;
}

export interface GenerateResponse {
  content: Array<ContentBlock>;
  tokens: TokenUsage[];
  duration: number;
  stopReason?: StopReason;
}

export interface ProviderToolAdapter {
  convertToProviderTool(tool: Tool): unknown;
}
