import { createWeatherTool } from '../../examples/shared/tools';
import { Agent } from '../agent';
import { BedrockProvider } from '@agenite/bedrock';
import { LLMStep } from '../steps/llm-call';
import { customStateReducer } from '../state/state-reducer';
import { BaseReturnValues } from '../steps';
const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const agent = new Agent({
  name: 'test',
  description: 'test',
  provider: bedrockProvider,
  tools: [createWeatherTool('dummy-key')],
  stateReducer: customStateReducer,
  steps: {
    'agenite.llm-call': {
      ...LLMStep,
      afterExecute: async (
        params: BaseReturnValues<Record<string, unknown>>
      ) => {
        return {
          state: { ...params.state, a: 100 },
          next: 'agenite.end',
        } as const;
      },
    },
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
      if (result.value.content.isEnd) {
        process.stdout.write('\n');
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

console.log(data.messages.length);
console.log(data.a === 1);
// console.log(data.a === '1');
// console.log(data.b);
