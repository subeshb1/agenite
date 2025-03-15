import { AllMiddlewareNextValues, AllMiddlewareReturnValues } from './agent';
import { AllMiddlewareYieldValues } from './agent';
import { MiddlewareBaseNextValue } from './middleware';
import { MiddlewareBaseYieldValue } from './middleware';
import { IntersectButUnionCommonProps } from './utils';
import { IfNeverOrIfAny } from './utils';
import { AsyncGeneratorMiddleware } from './agent';
import { StepWithReducerState } from '../agent';
import { StateFromReducer } from '../state/state-reducer';
import { AllStepsYieldValues, AllStepsNextValues, AnyStateReducer } from '../steps';

export type MergedYieldValues<MiddlewareYieldValues, StepYieldValues> =
  IfNeverOrIfAny<
    MiddlewareYieldValues,
    StepYieldValues,
    StepYieldValues | MiddlewareBaseYieldValue,
    StepYieldValues | MiddlewareYieldValues
  >;

export type MergedReturnValues<MiddlewareReturnValues, StepReturnValues> =
  IfNeverOrIfAny<
    MiddlewareReturnValues,
    StepReturnValues,
    StepReturnValues & {
      [key: string]: unknown;
    },
    IntersectButUnionCommonProps<StepReturnValues, MiddlewareReturnValues>
  >;

export type MergedNextValues<MiddlewareNextValues, StepNextValues> =
  IfNeverOrIfAny<
    MiddlewareNextValues,
    StepNextValues,
    StepNextValues | MiddlewareBaseNextValue,
    StepNextValues | MiddlewareNextValues
  >;

export type IterateResponse<
  Middlewares extends AsyncGeneratorMiddleware<
    MiddlewareBaseYieldValue,
    unknown,
    MiddlewareBaseNextValue
  >[],
  Steps extends {
    [key: string]: StepWithReducerState<Reducer>;
  },
  Reducer extends AnyStateReducer,
> = FullMergedMiddlewareStepGeneratorResponse<
  Middlewares,
  AllStepsYieldValues<Steps>,
  AllStepsNextValues<Steps>,
  StateFromReducer<Reducer>
>;
// export type IterateResponse<
//   Middlewares extends AsyncGeneratorMiddleware<
//     MiddlewareBaseYieldValue,
//     unknown,
//     MiddlewareBaseNextValue
//   >[],
//   Steps extends {
//     [key: string]: StepWithReducerState<Reducer>;
//   },
//   Reducer extends AnyStateReducer,
// > = AsyncGenerator<
//   MergedYieldValues<
//     AllMiddlewareYieldValues<Middlewares>,
//     AllStepsYieldValues<Steps>
//   >,
//   MergedReturnValues<
//     AllMiddlewareReturnValues<Middlewares>,
//     StateFromReducer<Reducer>
//   >,
//   MergedNextValues<
//     AllMiddlewareNextValues<Middlewares>,
//     AllStepsNextValues<Steps>
//   >
// >;

export type FullMergedMiddlewareStepGeneratorResponse<
  Middlewares extends AsyncGeneratorMiddleware<
    MiddlewareBaseYieldValue,
    unknown,
    MiddlewareBaseNextValue
  >[],
  YieldValues,
  NextValues,
  ReturnValues,
> = AsyncGenerator<
  MergedYieldValues<AllMiddlewareYieldValues<Middlewares>, YieldValues>,
  MergedReturnValues<AllMiddlewareReturnValues<Middlewares>, ReturnValues>,
  MergedNextValues<AllMiddlewareNextValues<Middlewares>, NextValues>
>;
