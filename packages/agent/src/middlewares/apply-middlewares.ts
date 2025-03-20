import { AsyncGeneratorMiddleware } from '../types/agent';
import { FullMergedMiddlewareStepGeneratorResponse } from '../types/execution';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from '../types/middleware';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
