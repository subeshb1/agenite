import { OllamaProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new OllamaProvider({
    model: 'deepseek-r1:8b',
  });

  // Generate a response
  const generator = await provider.generate(
    'What are the main features of Llama 2?'
  );

  // Handle streaming response
  console.log('\nAssistant: ', generator);

  console.log('\n');
}

main().catch(console.error);
