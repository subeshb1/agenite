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

  for await (const chunk of generator) {
    if (chunk.type === 'text') {
      process.stdout.write(chunk.text);
    }
  }

  // Handle streaming response

  console.log('\n');
}

main().catch(console.error);
