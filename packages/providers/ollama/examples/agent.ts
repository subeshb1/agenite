import { BaseMessage } from '@agenite/llm';
import { OllamaProvider } from '../src/provider';
// Example tool that gets current time
const getCurrentTime = () => new Date().toLocaleTimeString();
const getWeather = () => 'The weather is sunny';

// Tool definitions
const tools = [
  {
    name: 'getCurrentTime',
    description: 'Get the current time',
    execute: getCurrentTime,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getWeather',
    description: 'Get the current weather',
    execute: getWeather,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

async function simpleAgent(prompt: string) {
  const provider = new OllamaProvider({ model: 'llama3.2' });

  const systemPrompt = `You are a helpful assistant. You are given a task and you need to complete it.\n\n`;

  let stopReason;

  const messages: BaseMessage[] = [];
  console.log('Prompt:', prompt);

  while (stopReason !== 'endTurn') {
    // Get initial response
    const response = await provider.generate(messages, {
      systemPrompt: systemPrompt,
      tools,
    });

    messages.push({
      role: 'assistant',
      content: response.content,
    });

    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('Stop Reason:', response.stopReason);
    console.log('Token Usage:', JSON.stringify(response.tokenUsage, null, 2));

    if (response.stopReason === 'toolUse') {
      const toolUse = response.content.find(
        (content) => content.type === 'toolUse'
      );

      if (toolUse) {
        const tool = tools.find((tool) => tool.name === toolUse.name);

        if (!tool) throw new Error(`Tool ${toolUse.name} not found`);
        const toolResult = await tool.execute();
        messages.push({
          role: 'user',
          content: [
            {
              type: 'toolResult',
              toolUseId: toolUse.id,
              toolName: toolUse.name,
              content: toolResult,
            },
          ],
        });
      }
    }

    stopReason = response.stopReason;
  }
}

async function main() {
  await simpleAgent("What's the weather like today");
}

main().catch(console.error);
