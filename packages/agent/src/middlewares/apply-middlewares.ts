import { AsyncGeneratorMiddleware } from '../types/agent';
import { FullMergedMiddlewareStepGeneratorResponse } from '../types/execution';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from '../types/middleware';
import { StepContext } from '../types/step';
import { executionContextInjector } from './context-injector';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: StepContext<any>
): FullMergedMiddlewareStepGeneratorResponse<
  Middlewares,
  YieldValues & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executionContext: StepContext<any>;
  },
  NextValues,
  ReturnValues
> {
  return [...middlewares, executionContextInjector()].reduceRight(
    (gen, middleware) => middleware(gen, context),
    genFunc()
  );
}
