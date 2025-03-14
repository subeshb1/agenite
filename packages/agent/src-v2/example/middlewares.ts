import { userTextMessage } from '@agenite/llm';
import { createWeatherTool } from '../../examples/shared/tools';
import { Agent } from '../agent';
import { BedrockProvider } from '@agenite/bedrock';

const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

const agent = new Agent({
  name: 'test',
  description: 'test',
  provider: bedrockProvider,
  tools: [createWeatherTool('dummy-key')],
  middlewares: [
    async function* (generator, context) {
      let nextValue: unknown | undefined = undefined;
      while (true) {
        const { value, done } = await generator.next(nextValue);
        if (done) return value; // Return final result
        switch (value.type) {
          case 'agenite.llm-call.streaming':
            if (value.content.type === 'text') {
              process.stdout.write(value.content.text);
            }
            if (value.content.isEnd) {
              process.stdout.write('\n');
            }
            if (value.content.type === 'toolUse') {
              console.log(value);
            }
            break;
          default:
            // console.log(result);
            break;
        }
        nextValue = yield value;
      }
    },
  ],
});

// const iterator = agent.iterateWithMiddlewares({
//   messages: [
//     userTextMessage(
//       'What is the weather in Tokyo? And tell me about aws s3 security'
//     ),
//   ],
// });

// let result = await iterator.next();

// while (!result.done) {
//   result = await iterator.next();
// }

// console.log(result.value);

let data = await agent.execute({
  messages: [
    userTextMessage(
      'What is the weather in Tokyo? And tell me about aws s3 security'
    ),
  ],
});

console.log(data.messages);
