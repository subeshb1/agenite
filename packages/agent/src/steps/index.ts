import { StateReducer } from '../state/state-reducer';
import { AgentTokenUsage, BaseSteps } from '../types/agent';
import {
  Step,
  StepContext,
  BaseNextValue,
  BaseYieldValue,
} from '../types/step';

import { DefaultStepType } from '../types/step';
import { AgentStep } from './agent-call';
import { LLMStep } from './llm-call';
import { ToolStep } from './tool-call';
import { ToolResultStep } from './tool-result';

export interface BaseReturnValues<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  next: DefaultStepType | (string & {});
  state: T;
  tokenUsage?: AgentTokenUsage;
}

export type GeneratorYieldType<T extends AsyncGenerator> =
  T extends AsyncGenerator<infer Y, unknown, unknown> ? Y : never;

export type GeneratorReturnType<T extends AsyncGenerator> =
  T extends AsyncGenerator<unknown, infer R, unknown> ? R : never;

export type GeneratorNextType<T extends AsyncGenerator> =
  T extends AsyncGenerator<unknown, unknown, infer N> ? N : never;

export type AllStepsYieldValues<Steps extends BaseSteps> = GeneratorYieldType<
  ReturnType<Steps[keyof Steps]['execute']>
>;

export type AllStepsNextValues<Steps extends BaseSteps> = GeneratorNextType<
  ReturnType<Steps[keyof Steps]['execute']>
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStateReducer = StateReducer<Record<string, any>>;

export const defaultStepConfig = {
  'agenite.llm-call': LLMStep,
  'agenite.tool-call': ToolStep,
  'agenite.agent-call': AgentStep,
  'agenite.tool-result': ToolResultStep,
};

export const executeAgentStep = async function* (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: Step<BaseReturnValues<any>, BaseYieldValue, unknown, BaseNextValue>,
  executionContext: StepContext<AnyStateReducer>
) {
  const beforeResult = await task.beforeExecute(executionContext);
  const result = yield* task.execute(beforeResult, executionContext);
  const afterResult = await task.afterExecute(result, executionContext);
  return afterResult;
};

export type DefaultStepGenerator = AsyncGenerator<
  AllStepsYieldValues<typeof defaultStepConfig>,
  unknown,
  AllStepsNextValues<typeof defaultStepConfig>
>;
