import { Agent } from '@agenite/agent';
import { BedrockProvider } from '@agenite/bedrock';
import { prettyLogger } from '@agenite/pretty-logger';

const agent = new Agent({
  provider: new BedrockProvider({
    model: 'us.deepseek.r1-v1:0',
    region: 'us-west-2',
  }),
  name: 'Super Agent',
  middlewares: [prettyLogger()],
});

const userInput = `How many r's are in the word strawberry?"`;
const result = await agent.execute({
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: userInput }],
    },
  ],
});
