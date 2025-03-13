import { BaseMessage, LLMProvider } from '@agenite/llm';
import { AgentConfig } from './agent';
import { StateFromReducer, StateReducer } from '../state/state-reducer';

export interface StepContext<
  Reducer extends StateReducer<Record<string, unknown>>,
> {
  state: StateFromReducer<Reducer>;
  context: Record<string, unknown>;
  currentAgent: AgentConfig<Reducer>;
  parentAgent: AgentConfig<Reducer> | null;
  isChildStep: boolean;
  provider: LLMProvider;
  instructions: string;
  stream: boolean;
}

export type DefaultStepType =
  | 'agenite.llm-call'
  | 'agenite.tool-call'
  | 'agenite.agent-call'
  | 'agenite.tool-result'
  | 'agenite.end';

export interface Step<
  ReturnValues extends {
    next: DefaultStepType;
    state: {
      messages: BaseMessage[];
    };
  },
  YieldValues,
  StepParams,
  State,
> {
  /**
   * The name of the executor
   */
  name: string;
  /**
   * The beforeExecute function. Used to prepare the state for the Step.
   */
  beforeExecute: (
    params: StepContext<StateReducer<Record<string, any>>>
  ) => Promise<StepParams>;
  // TODO: Add type for params
  execute: (
    params: StepParams
  ) => AsyncGenerator<YieldValues, ReturnValues, State>;
  /**
   * The afterExecute function. Used to update the state after the Step.
   */
  afterExecute: (params: unknown) => Promise<ReturnValues>;
}
