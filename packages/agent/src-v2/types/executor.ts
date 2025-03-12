import { BaseMessage, LLMProvider } from '@agenite/llm';
import { AgentConfig } from './agent';

export interface ExecutionContext {
  state: {
    messages: BaseMessage[];
  } & Record<string, unknown>;
  context: Record<string, unknown>;
  currentAgent: AgentConfig<Record<string, unknown>>;
  parentAgent: AgentConfig<Record<string, unknown>> | null;
  isChildExecution: boolean;
  provider: LLMProvider;
  instructions: string;
  stream: boolean;
}

export type ExecutionType =
  | 'agenite.llm-call'
  | 'agenite.tool-call'
  | 'agenite.agent-call'
  | 'agenite.tool-result'
  | 'agenite.end';

export interface Executor<
  ReturnValues extends {
    next: ExecutionType;
    state: {
      messages: BaseMessage[];
    };
  },
  YieldValues,
  ExecutionParams,
  State,
> {
  /**
   * The name of the executor
   */
  name: string;
  /**
   * The beforeExecute function. Used to prepare the state for the execution.
   */
  beforeExecute: (params: ExecutionContext) => Promise<ExecutionParams>;
  // TODO: Add type for params
  execute: (
    params: ExecutionParams
  ) => AsyncGenerator<YieldValues, ReturnValues, State>;
  /**
   * The afterExecute function. Used to update the state after the execution.
   */
  afterExecute: (params: unknown) => Promise<ReturnValues>;
}
