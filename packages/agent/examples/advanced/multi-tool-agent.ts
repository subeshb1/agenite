/* eslint-disable turbo/no-undeclared-env-vars */

import { Agent } from '../../src';
import { calculatorTool, createWeatherTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';

async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create an agent with multiple tools
  const agent = new Agent({
    name: 'multi-tool-assistant',
    provider,
    tools: [calculatorTool, createWeatherTool('dummy-key')],
    systemPrompt: `You are a helpful assistant that can perform calculations and check weather.
When asked about weather and calculations in the same query, always check weather first, then do calculations.
Always use tools when available instead of doing calculations yourself.`,
  });

  // Example: Complex query using multiple tools
  const result = await agent.execute({
    messages:
      'What is the temperature in London? Also, can you multiply that temperature by 2?',
  });

  // Format and print results
  console.log('Final messages:', JSON.stringify(result.messages, null, 2));
  console.log('Token usage:', JSON.stringify(result.tokenUsage, null, 2));
}

main().catch(console.error);
