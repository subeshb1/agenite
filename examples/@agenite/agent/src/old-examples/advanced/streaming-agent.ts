/* eslint-disable turbo/no-undeclared-env-vars */

import { Agent } from '@agenite/agent';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { userTextMessage } from '@agenite/llm';

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
    instructions: `You are a math tutor that explains calculations step by step.
When using the calculator, first explain what you're going to calculate and why.
After getting the result, explain what it means.
Always use the calculator tool for actual calculations.`,
  });

  // Create an async iterator to handle the stream
  const iterator = agent.iterate(
    {
      messages: [
        userTextMessage(
          'Can you help me calculate the area of a circle with radius 5, and then multiply that by 2?'
        ),
      ],
    },
    { stream: true }
  );

  // Process the stream
  console.log('\nStarting conversation...\n');

  let result = await iterator.next();
  while (!result.done) {
    const value = result.value;

    // Handle different types of responses
    switch (value.type) {
      case 'agenite.start':
        console.log('🤔 Starting to process your question...\n');
        break;

      case 'agenite.llm-call.streaming':
        if (value.content.type === 'text') {
          // Stream the text response in real-time
          process.stdout.write(value.content.text);
        }
        break;

      case 'agenite.end':
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
