/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AsyncGeneratorMiddleware,
  BaseAgeniteIterateGenerator,
  BaseNextValue,
} from '@agenite/agent';

const logger = async function* (
  generator: BaseAgeniteIterateGenerator
): AsyncGenerator<any, any, any> {
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
export const middlewareWithAllAny = (): AsyncGeneratorMiddleware<
  any,
  any,
  any
> => {
  return logger;
};

export const middlewareWithYieldDefined = (): AsyncGeneratorMiddleware<
  | {
      type: `middleware.token`;
      a: 1;
      content: {
        type: string;
        text: string;
        isEnd: boolean;
      };
    }
  | {
      type: `middleware.usage`;
      a: 2;
    },
  any,
  any
> => {
  return logger;
};

export const middlewareWithReturnDefined = (): AsyncGeneratorMiddleware<
  | {
      type: `middleware.token`;
      b: 1;
      content: {
        type: string;
        text: string;
        isEnd: boolean;
      };
    }
  | {
      type: `middleware.usage`;
      b: 2;
    },
  {
    from: string;
  },
  any
> => {
  return logger;
};
