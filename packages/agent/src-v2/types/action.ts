import { BaseMessage, LLMProvider } from '@agenite/llm';
import { AgentConfig } from './agent';
import { StateFromReducer, StateReducer } from '../state/state-reducer';

export interface ActionContext<
  Reducer extends StateReducer<Record<string, unknown>>,
> {
  state: StateFromReducer<Reducer>;
  context: Record<string, unknown>;
  currentAgent: AgentConfig<Reducer>;
  parentAgent: AgentConfig<Reducer> | null;
  isChildAction: boolean;
  provider: LLMProvider;
  instructions: string;
  stream: boolean;
}

export type DefaultActionType =
  | 'agenite.llm-call'
  | 'agenite.tool-call'
  | 'agenite.agent-call'
  | 'agenite.tool-result'
  | 'agenite.end';

export interface Action<
  ReturnValues extends {
    next: DefaultActionType;
    state: {
      messages: BaseMessage[];
    };
  },
  YieldValues,
  ActionParams,
  State,
> {
  /**
   * The name of the executor
   */
  name: string;
  /**
   * The beforeExecute function. Used to prepare the state for the Action.
   */
  beforeExecute: (
    params: ActionContext<StateReducer<Record<string, any>>>
  ) => Promise<ActionParams>;
  // TODO: Add type for params
  execute: (
    params: ActionParams
  ) => AsyncGenerator<YieldValues, ReturnValues, State>;
  /**
   * The afterExecute function. Used to update the state after the Action.
   */
  afterExecute: (params: unknown) => Promise<ReturnValues>;
}
