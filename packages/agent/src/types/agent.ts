import {
  BaseMessage,
  TokenUsage,
  LLMProvider,
  ToolDefinition,
} from '@agenite/llm';
import { Tool } from '@agenite/tool';
import { Logger } from './logger';
import { ExecutionStep } from './execution';

export interface DetailedTokenUsage {
  total: {
    inputTokens: number;
    outputTokens: number;
  };
  completion: TokenUsage[];
  children: {
    [name: string]: {
      usage: TokenUsage[];
      details?: DetailedTokenUsage;
    };
  };
}

// Update AgentTool to be a union type
export type AgentTool = Tool | Agent;

export interface Agent {
  name: string;
  provider: LLMProvider;
  tools: AgentTool[];
  systemPrompt?: string;
  description?: string;
  stopCondition: StopCondition;
  inputSchema?: ToolDefinition['inputSchema'];

  iterate(
    params: AgentExecuteParams
  ): AsyncGenerator<
    ExecutionStep,
    { messages: BaseMessage[]; tokenUsage: DetailedTokenUsage },
    unknown
  >;
  execute(params: AgentExecuteParams): Promise<AgentExecuteResult>;
}

export interface AgentExecuteParams {
  messages: string | BaseMessage[];
  context?: AgentContext;
  stream?: boolean;
}

export interface AgentExecuteResult {
  messages: BaseMessage[];
  tokenUsage: DetailedTokenUsage;
}

export interface AgentOptions {
  name: string;
  provider: LLMProvider;
  tools?: AgentTool[];
  systemPrompt?: string;
  description?: string;
  stopCondition?: StopCondition;
  logger?: Logger;
}

export interface AgentContext {
  executionId: string;
  parentExecutionId?: string;
  metadata?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export interface AgentResponse {
  message: BaseMessage;
  stopReason?: StopReason;
  tokens: TokenUsage[];
}

export type StopReason = 'toolUse' | 'maxTokens' | 'stopSequence' | 'endTurn';
export type StopCondition = 'terminal' | 'toolUse' | 'toolResult';
