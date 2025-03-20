import { createWeatherTool } from '../../../examples/shared/tools';
import { Agent } from '../../agent';
import { BedrockProvider } from '@agenite/bedrock';
import { StateReducer, StateFromReducer } from '../../state/state-reducer';
import { BaseReturnValues } from '../../steps';
import { Step } from '../../types/step';
import { BaseMessage } from '@agenite/llm';
const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const customReducer: StateReducer<{
  /**
   * The counter for all the llm evaluation that happens
   */
  llmInvocationCount: number;
}> = {
  llmInvocationCount: (newValue?: number, previousValue?: number) => {
    return (previousValue || 0) + 1 + (newValue || 0) + 1;
  },
  messages: (newValue?: BaseMessage[], previousValue?: BaseMessage[]) => {
    return previousValue || [];
  },
};

const customStep: Step<
  BaseReturnValues<StateFromReducer<typeof customReducer>>,
  {
    type: 'agenite.llm-call.streaming';
    content: {
      type: string;
      text: string;
    };
  },
  {
    llmInvocationCount: number;
    messages: BaseMessage[];
  },
  undefined
> = {
  name: 'custom',
  beforeExecute: async () => {
    return {
      llmInvocationCount: 2,
      messages: [],
    };
  },
  execute: async function* (params) {
    yield {
      type: 'agenite.llm-call.streaming',
      content: {
        type: 'text',
        text: 'Hello',
      },
    } as const;
    return {
      next: 'agenite.end',
      state: {
        ...params,
        llmInvocationCount: 2,
      },
    } as const;
  },
  afterExecute: async (params) => {
    return params;
  },
};

const agent = new Agent({
  name: 'test',
  description: 'test',
  provider: bedrockProvider,
  tools: [createWeatherTool('dummy-key')],
  stateReducer: customReducer,
  steps: {
    'agenite.llm-call': customStep,
  },
});

const iterator = agent.iterate({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the weather in Tokyo? And tell me about aws s3 security',
        },
      ],
    },
  ],
});

let result = await iterator.next();

while (!result.done) {
  switch (result.value.type) {
    case 'agenite.llm-call.streaming':
      if (result.value.content.type === 'text') {
        process.stdout.write(result.value.content.text);
      }
      if (result.value.content.type === 'toolUse') {
        console.log(result.value);
      }
      break;
    default:
      // console.log(result);
      break;
  }
  result = await iterator.next();
}

console.log(result.value);

const data = await agent.execute({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the weather in Tokyo? And tell me about aws s3 security',
        },
      ],
    },
  ],
});

console.log(data.llmInvocationCount);
// console.log(data.a === '1');
// console.log(data.b);
