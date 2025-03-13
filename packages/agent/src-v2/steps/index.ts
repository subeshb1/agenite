import { BaseMessage } from '@agenite/llm';
import { Step, StepContext } from '../types/step';

import { DefaultStepType } from '../types/step';
import { AgentStep } from './agent-call';
import { LLMStep } from './llm-call';
import { ToolStep } from './tool-call';
import { ToolResultStep } from './tool-result';

export interface BaseReturnValues {
  next: DefaultStepType;
  state: {
    messages: BaseMessage[];
  };
}

export type GeneratorYieldType<T extends AsyncGenerator> =
  T extends AsyncGenerator<infer Y, unknown, unknown> ? Y : never;

export type AllStepsYieldValues<
  Steps extends {
    [key: string]: Step<any, unknown, unknown, unknown>;
  },
> = GeneratorYieldType<ReturnType<Steps[keyof Steps]['execute']>>;

export const defaultStepConfig = {
  'agenite.llm-call': LLMStep,
  'agenite.tool-call': ToolStep,
  'agenite.agent-call': AgentStep,
  'agenite.tool-result': ToolResultStep,
};

export const executeAgentStep = async function* (
  task: Step<BaseReturnValues, any, unknown, unknown>,
  executionContext: StepContext<any>
) {
  const beforeResult = await task.beforeExecute(executionContext);
  const result = yield* task.execute(beforeResult);
  const afterResult = await task.afterExecute(result);
  return afterResult;
};
