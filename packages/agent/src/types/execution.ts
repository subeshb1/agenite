import {
  BaseMessage,
  ToolUseBlock,
  ToolResultBlock,
  LLMProvider,
  PartialReturn,
} from '@agenite/llm';
import { Tool } from '@agenite/tool';
import {
  AgentResponse,
  DetailedTokenUsage,
  Agent,
  AgentContext,
} from './agent';
import { Logger } from './logger';

export interface ExecutionMetadata {
  toolUseId: string;
  agentName: string;
  parentAgentName?: string;
  parentExecutionId?: string;
  executionPath: string[];
}

export type ExecutionStep =
  | ExecutionStopStep
  | ExecutionStreamingStep
  | ExecutionToolUseStep
  | ExecutionToolResultStep
  | ExecutionStartStep;

export interface BaseExecutionStep {
  type: string;
  agentName: string;
  metadata?: ExecutionMetadata;
}

export interface ExecutionStopStep extends BaseExecutionStep {
  type: 'stop';
  response: AgentResponse;
  tokenUsage: DetailedTokenUsage;
}

export interface ExecutionStreamingStep extends BaseExecutionStep {
  type: 'streaming';
  response: PartialReturn;
}

export interface ExecutionToolUseStep extends BaseExecutionStep {
  type: 'toolUse';
  response: AgentResponse;
  tools: ToolExecutionBlock[];
  tokenUsage: DetailedTokenUsage;
}

export interface ExecutionToolResultStep extends BaseExecutionStep {
  type: 'toolResult';
  results: ToolResultExecutionBlock[];
  tokenUsage: DetailedTokenUsage;
}

export interface ExecutionStartStep extends BaseExecutionStep {
  type: 'start';
  message: BaseMessage;
}

export interface ToolExecutionBlock {
  type: 'agent' | 'tool';
  tool: ToolUseBlock;
}

export interface ToolResultExecutionBlock {
  type: 'agent' | 'tool';
  result: ToolResultBlock;
}

export interface ExecuteToolsParams {
  toolExecutionBlocks: ToolExecutionBlock[];
  tools: (Tool | Agent)[];
  context: AgentContext | undefined;
  logger: Logger;
  agentName: string;
  metadata?: ExecutionMetadata;
  provider: LLMProvider;
  stream?: boolean;
  currentExecutionPath: string[];
  messages?: BaseMessage[];
}
