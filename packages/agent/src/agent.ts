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
import { mergeAgentTokenUsage } from './utils/token-usage';

export class Agent<
  Reducer extends AnyStateReducer = typeof defaultStateReducer,
  Steps extends BaseSteps = typeof defaultStepConfig,
  Middlewares extends BaseMiddlewares = [],
  Extensions extends Record<string, unknown> | undefined = undefined,
> {
  constructor(
    public readonly agentConfig: AgentConfig<
      Reducer,
      Steps,
      Middlewares,
      Extensions
    >
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
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        modelBreakdown: {},
      },
    };

    const actions = this.agentConfig.steps || defaultStepConfig;

    const startStep = this.agentConfig.startStep || 'agenite.llm-call';

    const generator = async function* () {
      let currentStep: DefaultStepType | (string & {}) = startStep;

      yield {
        type: 'agenite.start',
        executionContext,
      };

      while (true) {
        if (currentStep === 'agenite.end') {
          break;
        }

        const step: BaseSteps[keyof BaseSteps] | undefined =
          actions[currentStep as keyof typeof actions];

        if (!step) {
          throw new Error(`Step ${currentStep} not found.`);
        }

        const result: BaseReturnValues<StateFromReducer<Reducer>> =
          yield* executeAgentStep(step, executionContext);

        if (result.tokenUsage) {
          executionContext.tokenUsage = mergeAgentTokenUsage(
            executionContext.tokenUsage,
            result.tokenUsage
          );
        }

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

        if (!result.next) {
          throw new Error(
            `No next step found. Previous step: ${currentStep}. Please review the step configuration to return a valid next step.`
          );
        }

        currentStep = result.next;
      }

      yield {
        type: 'agenite.end',
        executionContext,
      };

      return {
        ...executionContext.state,
        tokenUsage: executionContext.tokenUsage,
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
    options?: ExecutionOptions
  ) {
    const iterator = this.iterate(input, options);
    let result = await iterator.next();
    while (!result.done) {
      result = await iterator.next();
    }

    return result.value;
  }
}
