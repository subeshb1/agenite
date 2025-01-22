import { BedrockProvider } from '../src';

async function main() {
  // Initialize the provider
  const anthropic = new BedrockProvider({
    model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    region: 'us-east-1',
  });

  // Generate a response
  const generator = anthropic.iterate(
    'What are the main features of Claude 3?',
    {
      stream: true,
    }
  );

  // Handle response
  console.log('\nAssistant: ');
  let result = await generator.next();

  while (!result.done) {
    const chunk = result.value;
    if (chunk.content.type === 'text') {
      process.stdout.write(chunk.content.text);
    } else {
      console.log(chunk.content);
    }
    result = await generator.next();
  }

  console.log('\n');
  console.log('result', JSON.stringify(result, null, 2));
}

main().catch(console.error);
