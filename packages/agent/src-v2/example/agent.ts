import { createWeatherTool } from '../../examples/shared/tools';
import { Agent } from '../agent';
import { BedrockProvider } from '@agenite/bedrock';
import { LLMAction } from '../actions/llm-call';
import { customStateReducer } from '../state/state-reducer';
import { Action } from '../types/action';
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
  actions: {
    'agenite.llm-call': {
      ...LLMAction,
      afterExecute: async (params: any) => {
        return { ...params, next: 'agenite.end' };
      },
    },
  },
});

const iterator = agent.iterate(
  'What is the weather in Tokyo? And tell me about aws s3 security'
);

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

let data = await agent.execute('Hi');

console.log(data.a);
