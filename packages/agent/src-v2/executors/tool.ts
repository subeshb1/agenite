import { Executor } from '../types/executor';

import { BaseMessage } from '@agenite/llm';

export const ToolExecutor: Executor<any, any, any, any> = {
  name: 'agenite.tool-call',
  beforeExecute: async (params: unknown) => {
    return params;
  },
  execute: async function* (params: unknown): AsyncGenerator<
    {
      type: 'agenite.tool-call.params';
      output: string;
    },
    {
      next: 'agenite.tool-result';
      state: {
        messages: BaseMessage[];
      };
    },
    unknown
  > {
    yield {
      type: 'agenite.tool-call.params',
      output: 'Executed tool call',
    };

    return {
      next: 'agenite.tool-result',
      state: { messages: [] },
    };
  },
  afterExecute: async (params: unknown) => {
    return params;
  },
};
