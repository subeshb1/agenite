import { Agent } from '../../src';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { ToolResultBlock } from '@agenite/llm';

async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create an agent with a calculator tool
  const agent = new Agent({
    name: 'ioc-calculator',
    provider,
    tools: [calculatorTool],
    systemPrompt: `You are a math tutor that explains calculations step by step.
When using the calculator, first explain what you're going to calculate and why.
After getting the result, explain what it means.
Always use the calculator tool for actual calculations.`,
  });

  // Create an async iterator to handle the stream
  const iterator = agent.iterate({
    messages:
      'Can you help me calculate 25 divided by 5, and then multiply that by 3?',
  });

  // Process the stream and inject tool results
  console.log('\nStarting conversation with external tool results...\n');

  let result = await iterator.next();
  while (!result.done) {
    const value = result.value;

    // Handle different types of responses
    switch (value.type) {
      case 'start':
        console.log('🤔 Starting to process your question...\n');
        break;

      case 'streaming':
        if (value.response.type === 'text') {
          process.stdout.write(value.response.text);
        }
        break;

      case 'toolUse':
        if (value.tools[0]?.tool) {
          console.log('\n\n🔧 Calculator requested...');
          console.log(
            'Input:',
            JSON.stringify(value.tools[0].tool.input),
            '\n'
          );

          // Create a mock tool result
          const mockResult: ToolResultBlock[] = [
            {
              type: 'toolResult',
              toolUseId: value.tools[0].tool.id,
              toolName: value.tools[0].tool.name,
              content:
                value.tools[0].tool.name === 'calculator' &&
                value.tools[0].tool.input &&
                typeof value.tools[0].tool.input === 'object' &&
                'operation' in value.tools[0].tool.input &&
                value.tools[0].tool.input.operation
                  ? value.tools[0].tool.input.operation === 'divide'
                    ? '5' // 25/5 = 5
                    : '15' // 5*3 = 15
                  : 'Invalid operation',
            },
          ];

          // Pass the mock result to the next iteration
          result = await iterator.next(mockResult);
          continue;
        }
        break;

      case 'toolResult':
        if (value.results[0]?.result) {
          console.log(
            '\n✅ Using injected result:',
            value.results[0].result.content,
            '\n'
          );
        }
        break;

      case 'stop':
        console.log('\n🎯 Finished processing\n');
        break;
    }

    result = await iterator.next();
  }

  // Print final messages and token usage
  console.log(
    'Final messages:',
    JSON.stringify(result.value.messages, null, 2)
  );
  console.log(
    '\nToken usage:',
    JSON.stringify(result.value.tokenUsage, null, 2)
  );
}

main().catch(console.error);
