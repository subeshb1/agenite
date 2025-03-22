/* eslint-disable turbo/no-undeclared-env-vars */
import { Agent } from '@agenite/agent';
import { calculatorTool, createWeatherTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { Tool } from '@agenite/tool';
import { userTextMessage } from '@agenite/llm';
import { prettyLogger } from '@agenite/pretty-logger';

interface DelegateInput {
  input: string;
}

// Create a travel planning agent that uses a weather agent
async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create a specialized calculator agent
  const calculatorAgent = new Agent({
    name: 'calculator-specialist',
    provider,
    tools: [calculatorTool],
    instructions:
      'You are a math specialist. Always use the calculator tool for calculations.',
  });

  // Create a specialized weather agent
  const weatherAgent = new Agent({
    name: 'weather-specialist',
    provider,
    tools: [createWeatherTool('dummy-key')],
    instructions:
      'You are a weather specialist. Always check the weather when asked about temperature or conditions.',
  });

  // Create delegate tools for the coordinator
  const calculatorDelegateTool = new Tool<DelegateInput>({
    name: 'askCalculator',
    description: 'Ask the calculator specialist for help with math',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
    execute: async ({ input }) => {
      const result = await calculatorAgent.execute(
        {
          messages: [userTextMessage(input.input)],
        },
        {
          context: {
            executionId: crypto.randomUUID(),
            parentExecutionId: 'coordinator',
          },
        }
      );
      return {
        isError: false,
        data: JSON.stringify(result.messages[result.messages.length - 1]),
      };
    },
  });

  const weatherDelegateTool = new Tool<DelegateInput>({
    name: 'askWeather',
    description: 'Ask the weather specialist about weather conditions',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
    execute: async ({ input }) => {
      const result = await weatherAgent.execute(
        {
          messages: [userTextMessage(input.input)],
        },
        {
          context: {
            executionId: crypto.randomUUID(),
            parentExecutionId: 'coordinator',
          },
        }
      );
      return {
        isError: false,
        data: JSON.stringify(result.messages[result.messages.length - 1]),
      };
    },
  });

  // Create a coordinator agent that can delegate to specialized agents
  const coordinatorAgent = new Agent({
    name: 'coordinator',
    provider,
    tools: [calculatorDelegateTool, weatherDelegateTool],
    middlewares: [prettyLogger()],
    instructions: `You are a coordinator that delegates tasks to specialized agents.
For math questions, use askCalculator.
For weather questions, use askWeather.
For complex queries involving both, break them down and ask each specialist.`,
  });

  // Example: Complex query requiring multiple specialists
  const result = await coordinatorAgent.execute({
    messages: [
      userTextMessage(
        'What is the temperature in New York? If we double that temperature, what would it be?'
      ),
    ],
  });

  // Format and print results
  console.log('Final messages:', JSON.stringify(result.messages, null, 2));
  console.log('Token usage:', JSON.stringify(result.tokenUsage, null, 2));
}

main().catch(console.error);
