/* eslint-disable turbo/no-undeclared-env-vars */
import { Agent } from '../../src';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';

// Create a simple chat agent that can do basic math
async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create an agent with a calculator tool
  const agent = new Agent({
    name: 'math-buddy',
    provider,
    tools: [calculatorTool],
    systemPrompt:
      'You are a helpful math assistant. Use the calculator tool when you need to perform calculations. Always use tool even if the result is wrong. Re submit',
    // Stop after getting tool results to show intermediate steps
  });

  // Start a conversation
  const result = await agent.execute({
    input:
      'What is 1234 * 5678?  Always use tool even if the result is wrong. Re submit',
  });

  // Format and print results
  console.log('Final messages:', JSON.stringify(result.messages, null, 2));
  console.log('Token usage:', JSON.stringify(result.tokenUsage, null, 2));
}

main().catch(console.error);
