import { BedrockProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new BedrockProvider({
    model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: 'us-east-2',
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

  // Generate a response
  // const result = await provider.generate(
  //   'What are the main features of Llama 2?'
  // );
  // console.log('\nAssistant: ', result);

  const generator = provider.stream(
    `How many times does the letter 'r' appear in the word 'strawberry'?`
  );

  for await (const chunk of generator) {
    if (chunk.type === 'thinking') {
      if (chunk.isStart) {
        process.stdout.write('<Thinking> ');
      }
      process.stdout.write(chunk.thinking);
      if (chunk.isEnd) {
        process.stdout.write('</Thinking>\n');
      }
    } else if (chunk.type === 'text') {
      if (chunk.isStart) {
        process.stdout.write('<Assistant> ');
      }
      process.stdout.write(chunk.text);
      if (chunk.isEnd) {
        process.stdout.write('</Assistant>\n');
      }
    } else if (chunk.type === 'toolUse') {
      console.log('toolUse', JSON.stringify(chunk, null));
    }
  }

  // Handle streaming response

  console.log('\n');
}

main().catch(console.error);
