import { OllamaProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new OllamaProvider({
    model: 'llama3.2',
  });

  // Example conversation
  const messages = [
    {
      role: 'system' as const,
      content: [
        {
          type: 'text' as const,
          text: 'You are a helpful AI assistant.',
        },
      ],
    },
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: 'What are the main features of Llama 2?',
        },
      ],
    },
  ];

  // Generate a response
  const generator = provider.generate({
    messages,
    stream: true,
  });

  // Handle streaming response
  console.log('\nAssistant: ');
  for await (const chunk of generator) {
    if ('type' in chunk && chunk.type === 'partial') {
      process.stdout.write(chunk.content[0].text);
    }
  }
  console.log('\n');
}

main().catch(console.error);
