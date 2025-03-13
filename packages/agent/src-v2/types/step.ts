import { BaseMessage, LLMProvider } from '@agenite/llm';
import { StateFromReducer, StateReducer } from '../state/state-reducer';
import { Agent } from '../agent';

export interface StepContext<
  Reducer extends StateReducer<Record<string, unknown>>,
> {
  state: StateFromReducer<Reducer>;
  context: Record<string, unknown>;
  currentAgent: Agent<any, any>;
  parentAgent?: Agent<any, any>;
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
