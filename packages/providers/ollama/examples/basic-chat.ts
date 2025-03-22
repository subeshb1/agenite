import { OllamaProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new OllamaProvider({
    model: 'llama3.2',
  });

  // Generate a response
  const result = await provider.generate(
    'What are the main features of Llama 2?'
  );
  console.log('\nAssistant: ', result);

  const generator = provider.stream('What are the main features of Llama 2?');

  let chunk = await generator.next();
  while (!chunk.done) {
    if (chunk.value.type === 'text') {
      process.stdout.write(chunk.value.text);
    }
    chunk = await generator.next();
  }

  console.log('\nFinal response: ', chunk.value);
  // Handle streaming response

  console.log('\n');
}

main().catch(console.error);
