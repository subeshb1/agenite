import { AgentConfig, AsyncGeneratorMiddleware } from './types/agent';
import { StepContext, Step, DefaultStepType } from './types/step';
import {
  defaultStateReducer,
  StateFromReducer,
  StateReducer,
} from './state/state-reducer';
import { stateApplicator } from './state/state-applicator';
import {
  AllStepsYieldValues,
  BaseReturnValues,
  defaultStepConfig,
} from './steps';
import { executeAgentStep } from './steps';

interface ExecutionOptions {
  stream?: boolean;
  context?: Record<string, unknown>;
  isChildStep?: boolean;
}

export type StepWithReducerState<
  Reducer extends StateReducer<Record<string, unknown>>,
> = Step<
  BaseReturnValues<StateFromReducer<Reducer>>,
  unknown,
  unknown,
  unknown
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStateReducer = StateReducer<Record<string, any>>;

function applyMiddlewares<T, R>(
  genFunc: () => AsyncGenerator<T, R, any>,
  middlewares: AsyncGeneratorMiddleware<T, R, any>[],
  context: unknown
): AsyncGenerator<T, R, any> {
  return middlewares.reduceRight(
    (gen, middleware) => middleware(gen, context),
    genFunc()
  );
}

export class Agent<
  Reducer extends AnyStateReducer = typeof defaultStateReducer,
  Steps extends {
    [key: string]: StepWithReducerState<Reducer>;
  } = typeof defaultStepConfig,
> {
  constructor(public readonly agentConfig: AgentConfig<Reducer, Steps>) {}
  async *iterateWithMiddlewares(
    input: Partial<StateFromReducer<Reducer>>,
    options?: ExecutionOptions
  ): AsyncGenerator<
    AllStepsYieldValues<Steps>,
    StateFromReducer<Reducer>,
    unknown
  > {
    const result = yield* applyMiddlewares(
      () => this.iterate(input, options),
      this.agentConfig.middlewares || [],
      {}
    );
    return result;
  }

  async *iterate(
    input: Partial<StateFromReducer<Reducer>>,
    options?: ExecutionOptions
  ): AsyncGenerator<
    AllStepsYieldValues<Steps>,
    StateFromReducer<Reducer>,
    unknown
  > {
    let next: DefaultStepType = 'agenite.llm-call';

    const reducer: Reducer =
      this.agentConfig.stateReducer || (defaultStateReducer as Reducer);

    const state = stateApplicator(
      reducer,
      this.agentConfig.initialState || {},
      input
    );

    const executionContext: StepContext<Reducer> = {
      state,
      context: options?.context || {},
      currentAgent: this,
      isChildStep: options?.isChildStep || false,
      provider: this.agentConfig.provider,
      instructions:
        this.agentConfig.instructions || 'You are a helpful assistant.',
      stream: options?.stream || true,
    };

    const actions = this.agentConfig.steps || defaultStepConfig;
    while (true) {
      if (next === 'agenite.end') {
        break;
      }

      const step: StepWithReducerState<Reducer> | undefined = actions[next];

      if (!step) {
        throw new Error(`Step ${next} not found`);
      }

      const result: BaseReturnValues<StateFromReducer<Reducer>> =
        yield* executeAgentStep(step, executionContext);

      // Apply state changes after executor completes
      if (result.state) {
        const newState = stateApplicator(
          reducer,
          executionContext.state,
          result.state
        );

        executionContext.state = {
          ...executionContext.state,
          ...newState,
        };
      }

      next = result.next;
    }

    return {
      ...executionContext.state,
    };
  }

  async execute(
    input: StateFromReducer<Reducer>,
    options?: { stream?: boolean }
  ) {
    const iterator = this.iterateWithMiddlewares(input, options);
    let result = await iterator.next();
    while (!result.done) {
      result = await iterator.next();
    }

    return result.value;
  }
}
