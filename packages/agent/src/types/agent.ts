import { LLMProvider, ToolSchema } from '@agenite/llm';
import { Tool } from '@agenite/tool';
import { StateFromReducer } from '../state/state-reducer';
import {
  Step,
  BaseYieldValue,
  BaseNextValue,
  StepContext,
  DefaultStepType,
} from './step';
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
import { Agent } from '../agent';
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
    BaseYieldValue & {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      executionContext: StepContext<any>;
    },
    unknown,
    BaseNextValue
  > = BaseAgeniteIterateGenerator,
> = (
  generator: Generator,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: StepContext<any>
) => AsyncGenerator<
  Yield | GeneratorYieldType<Generator>,
  Return,
  Next | GeneratorNextType<Generator>
>;

export interface AgentConfig<
  CustomStateReducer extends AnyStateReducer,
  Steps extends BaseSteps,
  Middlewares extends BaseMiddlewares,
  Extensions extends Record<string, unknown> | undefined = undefined,
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
  agents?: Agent[];

  stateReducer?: CustomStateReducer;

  /**
   * The state of the agent
   */
  initialState?: Partial<StateFromReducer<CustomStateReducer>>;
  /**
   *
   */
  steps?: Steps;
  /**
   * startStep of the agent. Used to start the agent.
   * @default 'agenite.llm-call'
   */
  startStep?: Exclude<keyof Steps, number | symbol> | DefaultStepType;

  /**
   * The middlewares of the agent. Used to modify the behavior of the agent.
   */
  middlewares?: Middlewares;

  /**
   * The extensions of the agent. Used to extend the agent with custom functionality.
   */
  extensions?: Extensions;
}

export interface ExecutionOptions {
  stream?: boolean;
  context?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentExecution?: StepContext<any>;
}

export interface BaseSteps {
  [key: string]: Step<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BaseReturnValues<any>,
    BaseYieldValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    BaseNextValue | undefined
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

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  inputCost: number;
  outputCost: number;
  totalCost: number;
};

export interface AgentTokenUsage extends TokenUsage {
  modelBreakdown: ModelBreakdown;
}

export type ModelBreakdown = {
  [model: string]: TokenUsage;
};
