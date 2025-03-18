import { BaseMessage, LLMProvider, ToolSchema } from '@agenite/llm';
import { Tool } from '@agenite/tool';
import { StateFromReducer } from '../state/state-reducer';
import { Step, BaseYieldValue, BaseNextValue } from './step';
import {
  GeneratorYieldType,
  GeneratorNextType,
  GeneratorReturnType,
  BaseReturnValues,
  AnyStateReducer,
} from '../steps';
import {
  MiddlewareBaseYieldValue,
  MiddlewareBaseNextValue,
  BaseAgeniteIterateGenerator,
} from './middleware';

export type AllMiddlewareYieldValues<Middlewares extends BaseMiddlewares> =
  GeneratorYieldType<ReturnType<Middlewares[number]>>;

export type AllMiddlewareNextValues<Middlewares extends BaseMiddlewares> =
  GeneratorNextType<ReturnType<Middlewares[number]>>;

export type AllMiddlewareReturnValues<Middlewares extends BaseMiddlewares> =
  GeneratorReturnType<ReturnType<Middlewares[number]>>;

export type AsyncGeneratorMiddleware<
  Yield extends MiddlewareBaseYieldValue = MiddlewareBaseYieldValue,
  Return = unknown,
  Next extends MiddlewareBaseNextValue = MiddlewareBaseNextValue,
  Generator extends AsyncGenerator<
    BaseYieldValue,
    unknown,
    BaseNextValue
  > = BaseAgeniteIterateGenerator,
> = (
  generator: Generator,
  context: unknown
) => AsyncGenerator<
  Yield | GeneratorYieldType<Generator>,
  Return,
  Next | GeneratorNextType<Generator>
>;

export interface AgentConfig<
  CustomStateReducer extends AnyStateReducer,
  Steps extends BaseSteps,
  Middlewares extends BaseMiddlewares,
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

export interface ExecutionOptions {
  stream?: boolean;
  context?: Record<string, unknown>;
  isChildStep?: boolean;
}

export interface BaseSteps {
  [key: string]: Step<
    BaseReturnValues<any>,
    BaseYieldValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    BaseNextValue
  >;
}

export type BaseMiddlewares = AsyncGeneratorMiddleware<
  MiddlewareBaseYieldValue,
  unknown,
  MiddlewareBaseNextValue
>[];

export type AgentTool = {
  name: string;
  description: string;
  inputSchema?: ToolSchema;
};
