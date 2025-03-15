import { AgentConfig, AsyncGeneratorMiddleware } from './types/agent';
import {
  StepContext,
  Step,
  DefaultStepType,
  BaseYieldValue,
} from './types/step';
import {
  defaultStateReducer,
  StateFromReducer,
  StateReducer,
} from './state/state-reducer';
import { stateApplicator } from './state/state-applicator';
import { AnyStateReducer, BaseReturnValues, defaultStepConfig } from './steps';
import { executeAgentStep } from './steps';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from './types/middleware';
import { IterateResponse } from './types/execution';
import { applyMiddlewares } from './middlewares/apply-middlewares';

interface ExecutionOptions {
  stream?: boolean;
  context?: Record<string, unknown>;
  isChildStep?: boolean;
}

export type StepWithReducerState<
  Reducer extends StateReducer<Record<string, unknown>>,
> = Step<
  BaseReturnValues<StateFromReducer<Reducer>>,
  BaseYieldValue,
  unknown,
  unknown
>;

export class Agent<
  Reducer extends AnyStateReducer = typeof defaultStateReducer,
  Steps extends {
    [key: string]: StepWithReducerState<Reducer>;
  } = typeof defaultStepConfig,
  Middlewares extends AsyncGeneratorMiddleware<
    MiddlewareBaseYieldValue,
    unknown,
    MiddlewareBaseNextValue
  >[] = [],
> {
  constructor(
    public readonly agentConfig: AgentConfig<Reducer, Steps, Middlewares>
  ) {}

  public async *iterate(
    input: Partial<StateFromReducer<Reducer>>,
    options?: ExecutionOptions
  ): IterateResponse<Middlewares, Steps, Reducer> {
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

    const generator = async function* () {
      let next: DefaultStepType | (string & {}) = 'agenite.llm-call';

      while (true) {
        if (next === 'agenite.end') {
          break;
        }

        const step: StepWithReducerState<Reducer> | undefined =
          actions[next as keyof typeof actions];

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
    };

    return yield* applyMiddlewares(
      generator,
      this.agentConfig.middlewares || [],
      executionContext
    );
  }

  async execute(
    input: Partial<StateFromReducer<Reducer>>,
    options?: { stream?: boolean }
  ) {
    const iterator = this.iterate(input, options);
    let result = await iterator.next();
    while (!result.done) {
      result = await iterator.next();
    }

    return result.value;
  }
}
