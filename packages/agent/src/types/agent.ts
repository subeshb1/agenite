import { BaseMessage, TokenUsage, LLMProvider } from '@agenite/llm';
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

export interface Agent {
  name: string;
  provider: LLMProvider;
  tools: (Tool | Agent)[];
  systemPrompt?: string;
  description?: string;
  executableType: 'agent';
  stopCondition: StopCondition;

  iterate(params: {
    messages: string | BaseMessage[];
    context?: AgentContext;
    stream?: boolean;
  }): AsyncGenerator<ExecutionStep, { messages: BaseMessage[] }, unknown>;

  execute(params: {
    messages: string | BaseMessage[];
    context?: AgentContext;
    stream?: boolean;
  }): Promise<{
    messages: BaseMessage[];
    tokenUsage: DetailedTokenUsage;
  }>;
}

export interface AgentConfig {
  name: string;
  description?: string;
  provider?: LLMProvider;
  systemPrompt?: string;
  tools?: Agent['tools'];
  logger?: Logger;
  stopCondition?: StopCondition;
}

export interface AgentContext {
  executionId: string;
  parentExecutionId?: string;
  extraContext?: Record<string, unknown>;
}

export interface AgentResponse {
  message: BaseMessage;
  stopReason?: 'toolUse' | 'maxTokens' | 'stopSequence' | 'endTurn';
  tokens: TokenUsage[];
}

export interface ToolExecution {
  toolName: string;
  tokens?: TokenUsage[];
}

export type StopCondition = 'terminal' | 'toolUse' | 'toolResult'; 
