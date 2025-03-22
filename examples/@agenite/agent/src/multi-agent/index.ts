import { userTextMessage } from '@agenite/llm';
import { createWeatherTool } from '../old-examples/shared/tools';
import { Agent } from '@agenite/agent';
import { BedrockProvider } from '@agenite/bedrock';
import { prettyLogger } from '@agenite/pretty-logger';

const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const bedrockProvider2 = new BedrockProvider({
  model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  region: 'us-west-2',
  converseCommandConfig: {
    additionalModelRequestFields: {
      reasoning_config: {
        type: 'enabled',
        budget_tokens: 1024,
      },
    },
    inferenceConfig: {
      temperature: 1,
    },
  },
});

const nestedWeatherAgent = new Agent({
  name: 'nested-weather',
  description: 'nested weather agent',
  provider: bedrockProvider,
  tools: [createWeatherTool('dummy-key')],
});

const weatherAgent = new Agent({
  name: 'weather',
  description: 'weather agent',
  provider: bedrockProvider,
  agents: [nestedWeatherAgent],
});

const superVisorAgent = new Agent({
  name: 'superVisor',
  description: 'superVisor agent',
  instructions: 'You are a superVisor agent',
  provider: bedrockProvider2,
  agents: [weatherAgent],
  middlewares: [prettyLogger()],
});

const iterator = superVisorAgent.iterate({
  messages: [userTextMessage('Hi check weather in tokyo')],
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
