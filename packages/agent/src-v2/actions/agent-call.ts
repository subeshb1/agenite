import { Action } from '../types/action';

export const AgentAction: Action<any, any, any, any> = {
  name: 'agenite.agent-call',
  beforeExecute: async (params: unknown) => {
    return params;
  },
  execute: async function* (params: unknown): AsyncGenerator<
    {
      type: 'agenite.tool-result';
      output: string;
    },
    unknown,
    unknown
  > {
    yield {
      type: 'agenite.tool-result',
      output: 'Executed agent call',
    };

    return {
      next: 'agenite.end',
      output: 'Executed agent call',
    };
  },
  afterExecute: async (params: unknown) => {
    return params;
  },
};
