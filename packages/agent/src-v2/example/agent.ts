import { createWeatherTool } from '../../examples/shared/tools';
import { Agent } from '../agent';
import { OllamaProvider } from '@agenite/ollama';

const agent = new Agent({
  name: 'test',
  description: 'test',
  state: {
    messages: [],
  },
  provider: new OllamaProvider({
    model: 'qwen2.5:7b',
  }),
  tools: [createWeatherTool('dummy-key')],
  agents: [],
});

const iterator = agent.iterate('What is the weather in Tokyo? And tell me about aws s3 security');

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

console.log(result);
