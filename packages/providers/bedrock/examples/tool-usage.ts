import { BedrockProvider } from '../src';
import type {
  BaseMessage,
  ToolDefinition,
  ToolResultBlock,
  ToolUseBlock,
} from '@agenite/llm';

// Define a simple calculator tool
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description:
    'A simple calculator that can perform basic arithmetic operations',
  inputSchema: {
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

  // Process the conversation
  let currentMessages: BaseMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is 123 multiplied by 456? then 4 multiplied by 412312, 6*1212 and 3 / 1212122 and 1+1212312. Break step by step show your thought process',
        },
      ],
    },
  ];

  while (true) {
    const generator = provider.iterate(currentMessages, {
      tools: [calculatorTool],
      stream: true,
      systemPrompt:
        'You are a helpful AI assistant with access to a calculator tool. Always use tool to calculate and do it in parallel. Parallel tool calls please. And before you do anything add your reasoning in <thinking> block',
    });

    let response = await generator.next();
    while (!response.done) {
      if (response.value.type === 'thinking') {
        if (response.value.isStart) {
          process.stdout.write('<thinking>');
        }
        process.stdout.write(response.value.thinking);
        if (response.value.isEnd) {
          process.stdout.write('</thinking>');
        }
      } else if (response.value.type === 'text') {
        if (response.value.isStart) {
          process.stdout.write('<assistant>');
        }
        process.stdout.write(response.value.text);
        if (response.value.isEnd) {
          process.stdout.write('</assistant>');
        }
      } else if (response.value.type === 'toolUse') {
        console.log('\n');
        console.log('toolUse', JSON.stringify(response.value, null));
      }

      response = await generator.next();
    }

    const result = response.value;

    console.log('result', JSON.stringify(result, null, 2));
    // Check if the model wants to use a tool
    const toolUses = result.content.filter(
      (block): block is ToolUseBlock => block.type === 'toolUse'
    );

    if (toolUses.length > 0) {
      // Process all tool uses and collect results
      const toolResults: ToolResultBlock[] = await Promise.all(
        toolUses.map(async (toolUse) => {
          const input = toolUse.input as {
            operation: string;
            a: number;
            b: number;
          };
          try {
            const calculationResult = calculate(
              input.operation,
              input.a,
              input.b
            );
            return {
              type: 'toolResult',
              toolUseId: toolUse.id,
              toolName: toolUse.name,
              content: calculationResult.toString(),
            };
          } catch (error) {
            return {
              type: 'toolResult',
              toolUseId: toolUse.id,
              toolName: toolUse.name,
              content:
                error instanceof Error ? error.message : 'Calculation error',
              isError: true,
            };
          }
        })
      );

      // Add tool uses and results to messages
      currentMessages = [
        ...currentMessages,
        {
          role: 'assistant',
          content: result.content,
        },
        {
          role: 'user',
          content: toolResults,
        },
      ];
    } else {
      currentMessages = [
        ...currentMessages,
        {
          role: 'assistant',
          content: result.content,
        },
      ];
      // Model provided a final answer
      console.log('\nAssistant:', JSON.stringify(currentMessages, null, 2));
      break;
    }
  }
}

main().catch(console.error);
