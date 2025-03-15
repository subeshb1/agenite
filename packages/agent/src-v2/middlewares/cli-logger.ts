import {
  AllStepsNextValues,
  AllStepsYieldValues,
  BaseReturnValues,
  defaultStepConfig,
  DefaultStepGenerator,
} from '../steps';
import { AsyncGeneratorMiddleware } from '../types/agent';
import {
  MiddlewareBaseNextValue,
  MiddlewareBaseYieldValue,
} from '../types/middleware';
import { BaseNextValue, BaseYieldValue } from '../types/step';
export const cliLogger = (): AsyncGeneratorMiddleware<
  any,
  {
    from: string;
  },
  MiddlewareBaseNextValue,
  AsyncGenerator<
    AllStepsYieldValues<typeof defaultStepConfig>,
    BaseReturnValues,
    AllStepsNextValues<typeof defaultStepConfig>
  >
> => {
  return async function* (generator, context) {
    let nextValue: BaseNextValue | undefined = undefined;
    while (true) {
      const { value, done } = await generator.next(nextValue);
      if (done) return { ...value, from: 'me' }; // Return final result
      switch (value.type) {
        case 'agenite.llm-call.streaming':
          if (value.content.type === 'text') {
            process.stdout.write(value.content.text);
          }
          if (value.content.isEnd) {
            process.stdout.write('\n');
          }
          if (value.content.type === 'toolUse') {
            console.log(value);
          }
          break;
        default:
          // console.log(result);
          break;
      }
      nextValue = yield value;
    }
  };
};
