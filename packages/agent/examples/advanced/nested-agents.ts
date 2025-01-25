/* eslint-disable turbo/no-undeclared-env-vars */
import { Agent } from '../../src';
import { createWeatherTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';

// Create a travel planning agent that uses a weather agent
async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create a weather agent
  const weatherAgent = new Agent({
    name: 'weather-expert',
    provider,
    tools: [createWeatherTool(process.env.WEATHER_API_KEY || '')],
    systemPrompt:
      'You are a weather expert. Use the weather tool to provide accurate weather information.',
    stopCondition: 'toolResult',
  });

  // Create a travel planning agent that can use the weather agent
  const travelAgent = new Agent({
    name: 'travel-planner',
    provider,
    tools: [weatherAgent], // Weather agent is used as a tool
    systemPrompt: `You are a travel planner. When planning outdoor activities, 
    consult the weather-expert agent to check weather conditions.
    Always explain your recommendations based on the weather forecast.`,
    stopCondition: 'terminal', // Continue until final recommendation
  });

  // Example: Plan a day trip
  const result = await travelAgent.execute({
    messages: 'I want to go hiking in Seattle tomorrow. What do you recommend?',
    stream: true,
    // Add execution context for tracking
    context: {
      executionId: 'trip-planning-1',
      metadata: {
        userId: 'user-123',
        planningDate: new Date().toISOString(),
      },
    },
  });

  // Format and print results
  console.log(
    'Final recommendation:',
    JSON.stringify(result.messages, null, 2)
  );
  console.log(
    'Token usage breakdown:',
    JSON.stringify(result.tokenUsage, null, 2)
  );
}

main().catch(console.error);
