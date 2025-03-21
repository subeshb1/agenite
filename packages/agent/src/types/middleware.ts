import { BaseReturnValues } from '../steps';

import { AllStepsYieldValues } from '../steps';

import { defaultStepConfig } from '../steps';

import { AllStepsNextValues } from '../steps';
import { BaseNextValue, StepContext } from './step';

export type MiddlewareBaseYieldValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};

export type MiddlewareBaseNextValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};

export type BaseAgeniteIterateGenerator = AsyncGenerator<
  AllStepsYieldValues<typeof defaultStepConfig> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executionContext: StepContext<any>;
  },
  BaseReturnValues,
  AllStepsNextValues<typeof defaultStepConfig> | BaseNextValue
>;
