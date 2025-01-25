import { AgentResponse } from './agent';
import { ToolUseBlock, ToolResultBlock, BaseMessage } from './message';
import { DetailedTokenUsage } from './agent';

export interface NestedExecutionMetadata {
  toolUseId: string;
  agentName: string;
  parentAgentName: string;
  parentExecutionId?: string;
  executionPath: string[];
}

export type ExecutionStep =
  | {
      type: 'stop';
      response: AgentResponse;
      nestedExecution?: NestedExecutionMetadata;
      agentName: string;
      tokenUsage: DetailedTokenUsage;
    }
  | {
      type: 'streaming';
      response: AgentResponse;
      nestedExecution?: NestedExecutionMetadata;
      agentName: string;
    }
  | {
      type: 'toolUse';
      response: AgentResponse;
      tools: ToolExecutionBlock[];
      nestedExecution?: NestedExecutionMetadata;
      agentName: string;
      tokenUsage: DetailedTokenUsage;
    }
  | {
      type: 'toolResult';
      results: ToolResultExecutionBlock[];
      nestedExecution?: NestedExecutionMetadata;
      agentName: string;
      tokenUsage: DetailedTokenUsage;
    }
  | {
      type: 'start';
      agentName: string;
      nestedExecution?: NestedExecutionMetadata;
      message: BaseMessage;
    };

export interface ToolExecutionBlock {
  type: 'agent' | 'tool';
  tool: ToolUseBlock;
}

export interface ToolResultExecutionBlock {
  type: 'agent' | 'tool';
  result: ToolResultBlock;
}
