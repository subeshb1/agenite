import { BaseMessage, LLMProvider } from '@agenite/llm';
import { Tool } from '@agenite/tool';
import { StateFromReducer, StateReducer } from '../state/state-reducer';
import { Step, BaseYieldValue, BaseNextValue } from './step';
import {
  GeneratorYieldType,
  GeneratorNextType,
  GeneratorReturnType,
  BaseReturnValues,
} from '../steps';
import {
  MiddlewareBaseYieldValue,
  MiddlewareBaseNextValue,
} from './middleware';

export type AllMiddlewareYieldValues<
  Middlewares extends AsyncGeneratorMiddleware<any, any, any, any>[],
> = GeneratorYieldType<ReturnType<Middlewares[number]>>;

export type AllMiddlewareNextValues<
  Middlewares extends AsyncGeneratorMiddleware<any, any, any, any>[],
> = GeneratorNextType<ReturnType<Middlewares[number]>>;

export type AllMiddlewareReturnValues<
  Middlewares extends AsyncGeneratorMiddleware<any, any, any, any>[],
> = GeneratorReturnType<ReturnType<Middlewares[number]>>;

export type AsyncGeneratorMiddleware<
  Yield extends MiddlewareBaseYieldValue,
  Return,
  Next extends MiddlewareBaseNextValue,
  Generator extends AsyncGenerator<
    BaseYieldValue,
    unknown,
    BaseNextValue
  > = AsyncGenerator<any, any, any>,
> = (
  generator: Generator,
  context: unknown
) => AsyncGenerator<Yield, Return, Next>;

export interface AgentConfig<
  CustomStateReducer extends StateReducer<Record<string, any>>,
  Steps extends {
    [key: string]: Step<BaseReturnValues, BaseYieldValue, any, any>;
  },
  Middlewares extends AsyncGeneratorMiddleware<
    MiddlewareBaseYieldValue,
    unknown,
    MiddlewareBaseNextValue,
    AsyncGenerator<BaseYieldValue, unknown, BaseNextValue>
  >[],
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
  tools?: Tool[];
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

  middlewares?: Middlewares;
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
