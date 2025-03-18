import { BaseReturnValues } from '.';
import { Step } from '../types/step';

export type ToolCallYieldValues = {
  type: 'agenite.tool-call.params';
  output: string;
};

export const ToolStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  ToolCallYieldValues,
  unknown,
  undefined
> = {
  name: 'agenite.tool-call',
  beforeExecute: async (params: unknown) => {
    return params;
  },
  execute: async function* () {
    yield {
      type: 'agenite.tool-call.params',
      output: 'Executed tool call',
    };

    return {
      next: 'agenite.tool-result',
      state: { messages: [] },
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};
