import { Agent } from '@agenite/agent';
import { Tool } from '@agenite/tool';
import { OllamaProvider } from '@agenite/ollama';
import { prettyLogger } from '@agenite/pretty-logger';

// Create a calculator tool
const calculatorTool = new Tool<{ expression: string }>({
  name: 'calculator',
  description: 'Perform basic math operations',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string' },
    },
    required: ['expression'],
  },
  execute: async ({ input }) => {
    try {
      const result = new Function('return ' + input.expression)();
      return { isError: false, data: result.toString() };
    } catch (error) {
      if (error instanceof Error) {
        return { isError: true, data: error.message };
      }

      return { isError: true, data: 'Unknown error' };
    }
  },
});

// Create an agent
const agent = new Agent({
  name: 'math-buddy',
  provider: new OllamaProvider({
    model: 'llama3.2',
  }),
  tools: [calculatorTool],
  instructions: 'You are a helpful math assistant.',
  middlewares: [prettyLogger()],
});

// Example usage
const result = await agent.execute({
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'What is 1234 * 5678?' }],
    },
  ],
});

console.log(result);
