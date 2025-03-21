import { userTextMessage } from '@agenite/llm';
import { createWeatherTool } from '../../../examples/shared/tools';
import { Agent } from '../../agent';
import { BedrockProvider } from '@agenite/bedrock';
import { prettyLogger } from '@agenite/pretty-logger';

const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const bedrockProvider2 = new BedrockProvider({
  model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  region: 'us-west-2',
});

const weatherAgent = new Agent({
  name: 'weather',
  description: 'weather agent',
  provider: bedrockProvider2,
  tools: [createWeatherTool('dummy-key')],
});

const superVisorAgent = new Agent({
  name: 'superVisor',
  description: 'superVisor agent',
  instructions: 'You are a superVisor agent',
  provider: bedrockProvider,
  agents: [weatherAgent],
  middlewares: [prettyLogger()],
});

const iterator = superVisorAgent.iterate({
  messages: [
    userTextMessage(
      'What is the weather in Tokyo? And tell me about aws s3 security'
    ),
  ],
});

let result = await iterator.next();

while (!result.done) {
  // switch (result.value.type) {
  //   case 'agenite.llm-call.streaming':
  //     if (result.value.content.type === 'text') {
  //       process.stdout.write(result.value.content.text);
  //     }
  //     if (result.value.content.isEnd) {
  //       process.stdout.write('\n');
  //     }
  //     if (result.value.content.type === 'toolUse') {
  //       console.log(result.value.content);
  //     }
  //     break;
  //   default:
  //     // console.log(result);
  //     break;
  // }
  result = await iterator.next();
}

console.log(result.value);

console.log(JSON.stringify(result.value.tokenUsage, null, 2));
