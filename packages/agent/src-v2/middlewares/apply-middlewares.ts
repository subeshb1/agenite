import { AsyncGeneratorMiddleware } from '../types/agent';
import { FullMergedMiddlewareStepGeneratorResponse } from '../types/execution';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from '../types/middleware';
import { BaseNextValue, BaseYieldValue } from '../types/step';

export function applyMiddlewares<
  YieldValues,
  ReturnValues,
  NextValues,
  Middlewares extends AsyncGeneratorMiddleware<
    MiddlewareBaseYieldValue,
    unknown,
    MiddlewareBaseNextValue
  >[] = [],
>(
  genFunc: () => AsyncGenerator<any, any, any>,
  middlewares: Middlewares,
  context: unknown
): FullMergedMiddlewareStepGeneratorResponse<
  Middlewares,
  YieldValues,
  NextValues,
  ReturnValues
> {
  return middlewares.reduceRight(
    (gen, middleware) => middleware(gen, context),
    genFunc()
  );
}
