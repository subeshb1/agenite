import { BaseReturnValues } from '../steps';

import { AllStepsYieldValues } from '../steps';

import { defaultStepConfig } from '../steps';

import { AllStepsNextValues } from '../steps';
import { BaseNextValue } from './step';

export type MiddlewareBaseYieldValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};

export type MiddlewareBaseNextValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};

export type BaseAgeniteIterateGenerator = AsyncGenerator<
  AllStepsYieldValues<typeof defaultStepConfig>,
  BaseReturnValues,
  AllStepsNextValues<typeof defaultStepConfig> | BaseNextValue
>;
