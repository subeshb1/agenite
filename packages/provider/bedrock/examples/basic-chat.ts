import { BedrockProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new BedrockProvider({
    model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    region: 'us-west-2',
  });

  // Generate a response
  const result = await provider.generate(
    'What are the main features of Llama 2?'
  );
  console.log('\nAssistant: ', result);

  const generator = provider.stream('What are the main features of Llama 2?');

  for await (const chunk of generator) {
    console.log(chunk);
    if (chunk.type === 'text') {
      process.stdout.write(chunk.text);
    } else if (chunk.type === 'toolUse') {
      console.log('toolUse', JSON.stringify(chunk, null));
    }
  }

  // Handle streaming response

  console.log('\n');
}

main().catch(console.error);
