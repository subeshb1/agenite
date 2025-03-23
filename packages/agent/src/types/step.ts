import { LLMProvider } from '@agenite/llm';
import { StateFromReducer, StateReducer } from '../state/state-reducer';
import { Agent } from '../agent';
import { BaseReturnValues } from '../steps';
import { AgentTokenUsage } from './agent';

export type StepWithReducerState<
  Reducer extends StateReducer<Record<string, unknown>>,
> = Step<
  BaseReturnValues<StateFromReducer<Reducer>>,
  BaseYieldValue,
  unknown,
  BaseNextValue
>;

export interface StepContext<
  Reducer extends StateReducer<Record<string, unknown>>,
> {
  state: StateFromReducer<Reducer>;
  context: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent: Agent<Reducer, any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentExecution?: StepContext<any>;
  isNestedExecution?: boolean;
  provider: LLMProvider;
  instructions: string;
  stream: boolean;
  tokenUsage: AgentTokenUsage;
}

export type DefaultStepType =
  | 'agenite.llm-call'
  | 'agenite.tool-call'
  | 'agenite.agent-call'
  | 'agenite.tool-result'
  | 'agenite.end';

export interface Step<
  ReturnValues extends BaseReturnValues<Record<string, unknown>>,
  YieldValues,
  StepParams,
  NextValues extends BaseNextValue | undefined,
  State extends StateReducer<Record<string, unknown>> = StateReducer<
    Record<string, unknown>
  >,
> {
  /**
   * The name of the executor
   */
  name: string;
  /**
   * The beforeExecute function. Used to prepare the state for the Step.
   */
  beforeExecute: (params: StepContext<State>) => Promise<StepParams>;
  /**
   * The execute function. Used to execute the Step.
   */
  execute: (
    params: StepParams,
    context: StepContext<State>
  ) => AsyncGenerator<YieldValues, ReturnValues, NextValues>;
  /**
   * The afterExecute function. Used to update the state after the Step.
   */
  afterExecute: (
    params: ReturnValues,
    context: StepContext<State>
  ) => Promise<ReturnValues>;
}

export type BaseYieldValue = {
  type: string;
};

export type BaseNextValue =
  | {
      type: string;
    }
  | undefined;
