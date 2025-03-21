import {
  AgentConfig,
  BaseMiddlewares,
  BaseSteps,
  ExecutionOptions,
} from './types/agent';
import { StepContext, DefaultStepType } from './types/step';
import { defaultStateReducer, StateFromReducer } from './state/state-reducer';
import { stateApplicator } from './state/state-applicator';
import { AnyStateReducer, BaseReturnValues, defaultStepConfig } from './steps';
import { executeAgentStep } from './steps';
import { IterateResponse } from './types/execution';
import { applyMiddlewares } from './middlewares/apply-middlewares';

export class Agent<
  Reducer extends AnyStateReducer = typeof defaultStateReducer,
  Steps extends BaseSteps = typeof defaultStepConfig,
  Middlewares extends BaseMiddlewares = [],
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
      agent: this,
      parentExecution: options?.parentExecution,
      provider: this.agentConfig.provider,
      isNestedExecution: !!options?.parentExecution,
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

        const step: BaseSteps[keyof BaseSteps] | undefined =
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
