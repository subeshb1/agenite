import { OllamaProvider } from '../src';
import type { BaseMessage, ToolDefinition } from '@agenite/llm';

// Define a simple calculator tool
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description:
    'A simple calculator that can perform basic arithmetic operations',
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

// Calculator function implementation
function calculate(operation: string, a: number, b: number): number {
  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    default:
      throw new Error('Unknown operation');
  }
}

async function main() {
  // Initialize the provider
  const provider = new OllamaProvider({
    model: 'deepseek-r1:8b',
    host: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 2048,
  });

  // Process the conversation
  let currentMessages: BaseMessage[] = [
    {
      role: 'user',
      content: [{ type: 'text', text: 'What is 123 multiplied by 456?' }],
    },
  ];

  while (true) {
    const generator = provider.iterate(currentMessages, {
      tools: [calculatorTool],
      stream: false,
      systemPrompt:
        'You are a helpful AI assistant with access to a calculator tool. Use it to help users with math problems.',
    });

    const response = await generator.next();
    if (!response.done) continue;

    const result = response.value;

    // Check if the model wants to use a tool
    const toolUse = result.content.find(
      (
        block
      ): block is {
        type: 'toolUse';
        id: string;
        name: string;
        input: unknown;
      } => typeof block !== 'string' && block.type === 'toolUse'
    );

    if (toolUse) {
      console.log('\nAssistant: Let me calculate that for you...');

      // Execute the calculator tool
      const input = toolUse.input as {
        operation: string;
        a: number;
        b: number;
      };
      try {
        const calculationResult = calculate(input.operation, input.a, input.b);

        // Add tool result to messages
        currentMessages = [
          ...currentMessages,
          {
            role: 'assistant',
            content: [toolUse],
          },
          {
            role: 'user',
            content: [
              {
                type: 'toolResult',
                toolUseId: toolUse.id,
                toolName: toolUse.name,
                content: calculationResult.toString(),
              },
            ],
          },
        ];
      } catch (error) {
        // Handle calculation error
        currentMessages = [
          ...currentMessages,
          {
            role: 'assistant',
            content: [toolUse],
          },
          {
            role: 'user',
            content: [
              {
                type: 'toolResult',
                toolUseId: toolUse.id,
                toolName: toolUse.name,
                content:
                  error instanceof Error ? error.message : 'Calculation error',
                isError: true,
              },
            ],
          },
        ];
      }
    } else {
      // Model provided a final answer
      console.log('\nAssistant:', JSON.stringify(result, null, 2));
      break;
    }
  }
}

main().catch(console.error);
