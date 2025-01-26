import { Agent } from '../../src';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { BaseMessage, PartialReturn } from '@agenite/llm';

async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create an agent with a calculator tool
  const agent = new Agent({
    name: 'streaming-calculator',
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
      'Can you help me calculate the area of a circle with radius 5, and then multiply that by 2?',
    stream: true,
  });

  // Process the stream
  console.log('\nStarting conversation...\n');

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
          // Stream the text response in real-time
          process.stdout.write(value.response.text);
        }
        break;

      case 'toolUse':
        if (value.tools[0]?.tool) {
          console.log('\n\n🔧 Using calculator...');
          console.log(
            'Input:',
            JSON.stringify(value.tools[0].tool.input),
            '\n'
          );
        }
        break;

      case 'toolResult':
        if (value.results[0]?.result) {
          console.log(
            '\n✅ Calculator returned:',
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

  console.log(
    'Final messages:',
    JSON.stringify(result.value.messages, null, 2)
  );

  // Print final token usage
  console.log(
    '\nToken usage:',
    JSON.stringify(result.value.tokenUsage, null, 2)
  );
}

main().catch(console.error);
