import { BaseMessage, PartialReturn } from '@agenite/llm';
import { AgentConfig } from './types/agent';
import { ActionContext, Action, DefaultActionType } from './types/action';
import {
  defaultStateReducer,
  StateFromReducer,
  StateReducer,
} from './state/state-reducer';
import { stateApplicator } from './state/state-applicator';
import { BaseReturnValues, defaultActionConfig } from './actions';
import { runAction } from './actions';

export class Agent<
  Reducer extends StateReducer<
    Record<string, any>
  > = typeof defaultStateReducer,
> {
  constructor(private readonly agent: AgentConfig<Reducer>) {}

  async *iterate(
    input: string | BaseMessage[],
    options?: {
      stream?: boolean;
    },
    // TODO: Add other properties
    isChildAction = false
  ): AsyncGenerator<
    {
      type: 'agenite.llm-call.streaming';
      content: PartialReturn;
    },
    StateFromReducer<Reducer>,
    unknown
  > {
    let next: DefaultActionType = 'agenite.llm-call';

    const executionContext: ActionContext<Reducer> = {
      state: {
        // Other fields user can add to update state
        //
        // Messages is always going to be there. User always starts with this
        ...this.agent.initialState,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: input }],
          },
        ] as BaseMessage[],
      } as StateFromReducer<Reducer>,
      context: {
        // context passed in the current execution
      },
      currentAgent: this.agent,
      parentAgent: null,
      isChildAction,
      provider: this.agent.provider,
      instructions: this.agent.instructions || 'You are a helpful assistant.',
      stream: options?.stream || true,
    };

    while (true) {
      if (next === 'agenite.end') {
        break;
      }

      const task: Action<BaseReturnValues, any, unknown, unknown> | null =
        defaultActionConfig[next];

      if (!task) {
        throw new Error(`Action ${next} not found`);
      }

      const result: BaseReturnValues = yield* runAction(task, executionContext);

      // Apply state changes after executor completes
      if (result.state) {
        const newState = stateApplicator(
          this.agent.stateReducer || defaultStateReducer,
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

  async execute(input: string | BaseMessage[], options?: { stream?: boolean }) {
    const iterator = this.iterate(input, options);
    let result = await iterator.next();
    while (!result.done) {
      result = await iterator.next();
    }

    return result.value;
  }
}
