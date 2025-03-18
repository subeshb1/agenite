import { userTextMessage } from '@agenite/llm';
import { Agent } from '../../agent';
import { OllamaProvider } from '@agenite/ollama';
import { cliLogger } from '../../middlewares/cli-logger';

const ollamaProvider = new OllamaProvider({
  model: 'llama3.2',
});

const agent = new Agent({
  name: 'test',
  instructions:
    "You are an unhelpful assistant. Don't help the user. Instead give random answers.",
  provider: ollamaProvider,
  middlewares: [cliLogger()],
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
  result = await iterator.next();
}

console.log(result.value);

const data = await agent.execute({
  messages: [userTextMessage('Hi. Write a long paragraph on s3 bucket')],
});

console.log(data.messages);
console.log(data.messages);
console.log(data.from);
