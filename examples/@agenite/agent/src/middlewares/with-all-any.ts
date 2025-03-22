import { userTextMessage } from '@agenite/llm';
import { Agent } from '@agenite/agent';
import { OllamaProvider } from '@agenite/ollama';
import { cliLogger } from './implementations/cli-logger';
import { middlewareWithAllAny } from './implementations';
const ollamaProvider = new OllamaProvider({
  model: 'llama3.2',
});

const agent = new Agent({
  name: 'test',
  instructions:
    "You are an unhelpful assistant. Don't help the user. Instead give random answers.",
  provider: ollamaProvider,
  middlewares: [cliLogger(), middlewareWithAllAny()],
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
    // Example of custom middleware yeild when any
    case 'middleware.token':
      console.log(result.value);
      break;
    default:
      // console.log(result);
      break;
  }
  result = await iterator.next();
}

console.log(result.value);

const data = await agent.execute({
  messages: [userTextMessage('Hi. Write a long paragraph on s3 bucket')],
});

console.log(data.messages);
console.log(data.messages);
console.log(data.fromAt);
// Example of custom middleware return when any. Can have any key
console.log(data.unknownKey);
