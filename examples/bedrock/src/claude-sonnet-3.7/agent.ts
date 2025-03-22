import { Agent } from '@agenite/agent';
import { BedrockProvider } from '@agenite/bedrock';
import { prettyLogger } from '@agenite/pretty-logger';
const agent = new Agent({
  provider: new BedrockProvider({
    model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: 'us-east-2',
    enableReasoning: true,
    reasoningBudgetTokens: 4000,
  }),
  name: 'Super Agent',
  middlewares: [prettyLogger()],
});

const userInput = `How many r's are in the word strawberry?"`;
const iterator = agent.execute({
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: userInput }],
    },
  ],
});
