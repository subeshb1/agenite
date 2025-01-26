/* eslint-disable turbo/no-undeclared-env-vars */
import { Agent } from '../../src';
import { calculatorTool } from '../shared/tools';
import { createProvider } from '../shared/provider-factory';
import { BaseMessage } from '@agenite/llm';

async function main() {
  // Initialize the LLM provider
  const provider = createProvider({
    type: process.env.PROVIDER_TYPE,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
  });

  // Create an agent that maintains a running calculation
  const agent = new Agent({
    name: 'stateful-calculator',
    provider,
    tools: [calculatorTool],
    systemPrompt: `You are a helpful math assistant that maintains a running total.
Keep track of the current total and explain each calculation step.
Always use the calculator tool for calculations.
After each calculation, mention the current total.
Remember previous calculations when asked about history.`,
  });

  // Keep track of conversation history
  let messages: BaseMessage[] = [];

  // Function to process a query and print results
  async function processQuery(query: string) {
    console.log('\n👉 User:', query);

    const result = await agent.execute({
      // Pass all previous messages along with the new query
      messages: [
        ...messages,
        { role: 'user', content: [{ type: 'text', text: query }] },
      ],
    });

    // Update conversation history with both the user's message and the response
    messages = result.messages;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      console.log('🤖 Assistant:', formatMessage(lastMessage));
    }

    return result;
  }

  // Run a sequence of calculations
  console.log('\n🔢 Starting stateful calculations...\n');

  // First calculation: Add 10
  await processQuery('Add 10 to the total');

  // Second calculation: Multiply by 2
  await processQuery('Multiply the current total by 2');

  // Third calculation: Divide by 5
  await processQuery('Divide the current total by 5');

  // Ask about history
  await processQuery(
    'Can you tell me what calculations we did and what the current total is?'
  );
}

// Helper function to format messages
function formatMessage(message: BaseMessage): string {
  return message.content
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'toolUse') return `[Using ${block.name}...]`;
      return '';
    })
    .join(' ');
}

main().catch(console.error);
