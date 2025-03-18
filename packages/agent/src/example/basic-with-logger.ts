import { userTextMessage } from '@agenite/llm';
import { createWeatherTool } from '../../examples/shared/tools';
import { Agent } from '../agent';
import { BedrockProvider } from '@agenite/bedrock';
import { prettyLogger } from '@agenite/pretty-logger';
const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const agent = new Agent({
  name: 'test',
  description: 'test',
  provider: bedrockProvider,
  tools: [createWeatherTool('dummy-key')],
  middlewares: [prettyLogger()],
});

await agent.execute({
  messages: [userTextMessage('hi can you show me the weather in tokyo')],
});
