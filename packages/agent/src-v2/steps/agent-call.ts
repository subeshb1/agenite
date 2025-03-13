import { Step } from '../types/step';

type AgentCallYieldValues = {
  type: 'agenite.agent-call';
  output: string;
};

export const AgentStep: Step<any, AgentCallYieldValues, any, any> = {
  name: 'agenite.agent-call',
  beforeExecute: async (params: unknown) => {
    return params;
  },
  execute: async function* (
    params: unknown
  ): AsyncGenerator<AgentCallYieldValues, unknown, unknown> {
    yield {
      type: 'agenite.agent-call',
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
