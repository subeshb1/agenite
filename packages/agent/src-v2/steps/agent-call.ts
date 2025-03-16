import { Step } from '../types/step';
import { BaseReturnValues } from '.';

type AgentCallYieldValues =
  | {
      type: 'agenite.agent-call';
      output: string;
    }
  | {
      type: 'agenite.end';
      output: string;
    };

export const AgentStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  AgentCallYieldValues,
  unknown,
  undefined
> = {
  name: 'agenite.agent-call',
  beforeExecute: async (params: unknown) => {
    return params;
  },
  execute: async function* () {
    yield {
      type: 'agenite.agent-call',
      output: 'Executed agent call',
    };

    return {
      next: 'agenite.end',
      state: {
        messages: [],
      },
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};
