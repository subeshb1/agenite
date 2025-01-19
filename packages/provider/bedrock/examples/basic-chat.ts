import { BedrockProvider } from '../src';

async function main() {
  // Initialize the provider
  const provider = new BedrockProvider({
    model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    region: 'us-east-1',
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
          text: 'What are the main features of Claude 3?',
        },
      ],
    },
  ];

  // Generate a response
  const generator = provider.generate({
    messages,
    stream: false,
  });

  // Handle response
  console.log('\nAssistant: ');
  let result = await generator.next();
  while (!result.done) {
    const chunk = result.value;
    if ('content' in chunk) {
      if ('text' in chunk.content[0]) {
        process.stdout.write(chunk.content[0].text);
      } else {
        console.log(chunk.content[0]);
      }
    }
    result = await generator.next();
  }
  console.log('\n');
  console.log('result', JSON.stringify(result, null, 2));
}

main().catch(console.error);
