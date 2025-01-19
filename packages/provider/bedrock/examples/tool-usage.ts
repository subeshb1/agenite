import { BedrockProvider } from '../src';
import { ToolDefinition } from '../../../llm/src';

async function main() {
  // Initialize the provider
  const provider = new BedrockProvider({
    model: 'amazon.nova-micro-v1:0',
    region: 'us-east-1',
  });

  // Define a calculator tool
  const calculatorTool: ToolDefinition = {
    name: 'calculator',
    description: 'Performs basic arithmetic operations',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'The arithmetic operation to perform',
        },
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
      required: ['operation', 'a', 'b'],
    },
  };

  // Example conversation with tool use
  const messages = [
    {
      role: 'system' as const,
      content: [
        {
          type: 'text' as const,
          text: 'You are a helpful AI assistant that can perform calculations. When invoking a tool make parallel calls. For each tool call you make add <thinking> blocks',
        },
      ],
    },
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: 'What is 123 multiplied by 456 and 2 multiplied by 3? Parellel call these. For each tool call you make add <thinking> blocks',
        },
      ],
    },
  ];

  // Generate a response
  const generator = provider.generate({
    messages,
    tools: [calculatorTool],
    stream: true,
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
