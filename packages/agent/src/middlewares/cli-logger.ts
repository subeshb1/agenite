/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncGeneratorMiddleware } from '../types/agent';
import { MiddlewareBaseNextValue } from '../types/middleware';
import { BaseNextValue } from '../types/step';
export const cliLogger = (): AsyncGeneratorMiddleware<
  any,
  {
    from: string;
  },
  MiddlewareBaseNextValue
> => {
  return async function* (generator) {
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
