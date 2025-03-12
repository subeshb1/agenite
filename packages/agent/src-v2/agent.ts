import { BaseMessage, PartialReturn } from '@agenite/llm';
import { AgentConfig } from './types/agent';
import { ExecutionContext, Executor, ExecutionType } from './types/executor';
import { AgentExecutor } from './executors/agent';
import { ToolResultExecutor } from './executors/tool-result';
import { ToolExecutor } from './executors/tool';
import { LLMExecutor } from './executors/llm';

const executionConfig: Record<ExecutionType, Executor<any, any, any, any>> = {
  'agenite.llm-call': LLMExecutor,
  'agenite.tool-call': ToolExecutor,
  'agenite.agent-call': AgentExecutor,
  'agenite.tool-result': ToolResultExecutor,
};

interface BaseReturnValues {
  next: ExecutionType;
  state: {
    messages: BaseMessage[];
  };
}

const executorExecutor = async function* (
  executor: Executor<BaseReturnValues, any, unknown, unknown>,
  executionContext: ExecutionContext
) {
  const beforeResult = await executor.beforeExecute(executionContext);
  const result = yield* executor.execute(beforeResult);
  const afterResult = await executor.afterExecute(result);
  return afterResult;
};

const stateReducer = {
  messages: (newValue?: BaseMessage[], previousValue?: BaseMessage[]) => {
    if (!newValue) {
      return previousValue;
    }

    return [...(previousValue || []), ...newValue];
  },
};

type AgentState = {
  messages: BaseMessage[];
  [key: string]: unknown;
};

const stateApplicator = (
  previousState: AgentState,
  newState: Partial<AgentState>
) => {
  // Start with a copy of previous state to ensure required fields are preserved
  const updatedState: AgentState = {
    ...previousState,
    messages: previousState.messages || [], // Ensure messages is always present
  };

  // Iterate through all keys in newState
  for (const key in newState) {
    // If there's a reducer for this key, use it
    if (key in stateReducer) {
      updatedState[key] = stateReducer[key as keyof typeof stateReducer](
        newState[key] as any,
        previousState[key] as any
      );
    } else {
      // If no reducer, only override if new value exists
      if (newState[key] !== undefined) {
        updatedState[key] = newState[key];
      }
    }
  }

  return updatedState;
};

export class Agent {
  constructor(private readonly agent: AgentConfig<Record<string, unknown>>) {}

  async *iterate(
    input: string | BaseMessage[],
    options?: {
      stream?: boolean;
    },
    // TODO: Add other properties
    isChildExecution = false
  ): AsyncGenerator<
    {
      type: 'agenite.llm-call.streaming';
      content: PartialReturn;
    },
    unknown,
    unknown
  > {
    let next: ExecutionType = 'agenite.llm-call';

    const executionContext: ExecutionContext = {
      state: {
        // Other fields user can add to update state
        //
        // Messages is always going to be there. User always starts with this
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: input }],
          },
        ],
      },
      context: {
        // context passed in the current execution
      },
      currentAgent: this.agent,
      parentAgent: null,
      isChildExecution,
      provider: this.agent.provider,
      instructions: this.agent.instructions || 'You are a helpful assistant.',
      stream: options?.stream || true,
    };

    while (true) {
      if (next === 'agenite.end') {
        break;
      }

      const executor: Executor<any, any, unknown, unknown> =
        executionConfig[next];

      const result = yield* executorExecutor(executor, executionContext);

      // Apply state changes after executor completes
      if (result.state) {
        const newState = stateApplicator(executionContext.state, result.state);
        executionContext.state = newState;
      }

      next = result.next;
    }

    return {
      ...executionContext.state,
    };
  }
}
