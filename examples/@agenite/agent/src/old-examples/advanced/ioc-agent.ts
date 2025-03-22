/* eslint-disable turbo/no-undeclared-env-vars */

import { Agent } from '@agenite/agent';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { ToolUseBlock, userTextMessage } from '@agenite/llm';
import { ToolResponse } from '@agenite/tool';

// Add this helper function before the main function
function promptUser(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${question} (y/n): `);

    const onData = (data: Buffer) => {
      const answer = data.toString().trim().toLowerCase();
      process.stdin.removeListener('data', onData);
      resolve(answer === 'y' || answer === 'yes');
    };

    process.stdin.on('data', onData);
  });
}

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
    instructions: `You are a math tutor that explains calculations step by step.
When using the calculator, first explain what you're going to calculate and why.
After getting the result, explain what it means.
Always use the calculator tool for actual calculations.

If the user doesn't have permission to use the calculator, end the process.
`,
  });

  // Create an async iterator to handle the stream
  const iterator = agent.iterate({
    messages: [
      userTextMessage(
        'Can you help me calculate 25 divided by 5, and then multiply that by 3?'
      ),
    ],
  });

  // Process the stream and inject tool results
  console.log('\nStarting conversation with external tool results...\n');

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
          process.stdout.write(value.content.text);
        }
        break;

      case 'agenite.tool-call.params':
        if (value.toolUseBlocks[0]) {
          console.log('\n\n🔧 Calculator requested...');
          console.log(
            'Input:',
            JSON.stringify(value.toolUseBlocks[0].input),
            '\n'
          );

          const shouldContinue = await promptUser(
            'Do you want to allow this calculation?'
          );

          if (!shouldContinue) {
            // Create error response if user denies
            const mockResult: {
              result: ToolResponse;
              toolUseBlock: ToolUseBlock;
            } = {
              result: {
                isError: true,
                data: 'User denied the calculation request',
              },
              toolUseBlock: value.toolUseBlocks[0],
            };
            result = await iterator.next({
              type: 'agenite.tool-call.next',
              toolResultBlocks: [mockResult],
            });
            continue;
          }
        }
        break;

      case 'agenite.end':
        console.log('\n🎯 Finished processing\n');
        break;
    }

    result = await iterator.next();
  }
}

main().catch(console.error);
