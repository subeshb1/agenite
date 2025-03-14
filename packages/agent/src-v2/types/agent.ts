import { BaseMessage, LLMProvider } from '@agenite/llm';
import { Tool } from '@agenite/tool';
import { StateFromReducer, StateReducer } from '../state/state-reducer';
import { Step } from './step';

export type AsyncGeneratorMiddleware<Yield, Return, Next> = (
  generator: AsyncGenerator<Yield, Return, Next>,
  context: unknown
) => AsyncGenerator<Yield, Return, Next>;

export interface AgentConfig<
  CustomStateReducer extends StateReducer<Record<string, any>>,
  Steps extends {
    [key: string]: Step<any, any, any, any>;
  },
> {
  /**
   * The name of the agent
   */
  name: string;
  /**
   * The LLM provider of the agent
   */
  provider: LLMProvider;
  /**
   * The tools of the agent
   */
  tools: Tool[];
  /**
   * The system prompt of the agent
   */
  instructions?: string;
  /**
   * The description of the agent. This is used to describe the agent to the other agents.
   */
  description?: string;
  /**
   * The other agents that this agent can call
   */
  agents?: unknown[];

  stateReducer?: CustomStateReducer;

  /**
   * The state of the agent
   */
  initialState?: Partial<StateFromReducer<CustomStateReducer>>;
  /**
   *
   */
  steps?: Steps;

  middlewares?: AsyncGeneratorMiddleware<any, any, any>[];
}

export interface AgentMethods {
  /**
   * The method to call the agent
   */
  execute: (
    input: string | BaseMessage[],
    options?: unknown
  ) => Promise<string>;

  /**
   * The method to iterate the agent
   */
  iterate?: (
    input: string | BaseMessage[],
    options?: unknown
  ) => AsyncGenerator<string, void, unknown>;
}
