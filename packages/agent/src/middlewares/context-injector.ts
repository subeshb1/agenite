import { AsyncGeneratorMiddleware } from '../types/agent';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from '../types/middleware';
import { BaseNextValue } from '../types/step';

/**
 * Injects the execution context into the every yield value
 * @returns
 */
export const executionContextInjector = (): AsyncGeneratorMiddleware<
  MiddlewareBaseYieldValue,
  unknown,
  MiddlewareBaseNextValue
> => {
  return async function* (generator, context) {
    let nextValue: BaseNextValue | undefined = undefined;

    while (true) {
      const { value, done } = await generator.next(nextValue);

      if (done) {
        return value;
      }

      // Inject context into the yield value
      const valueWithContext = {
        ...value,
        // If it's a next value, use the context from the generator else inject the context
        executionContext: value.executionContext || context,
      };

      nextValue = yield valueWithContext;
    }
  };
};
