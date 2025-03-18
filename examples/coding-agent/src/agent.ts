import { Agent } from '@agenite/agent';
import { getLLMProvider, printMessage } from '@agenite-examples/llm-provider';
import { createFileSystemTool } from './tools/file-system';
import { createCommandRunnerTool } from './tools/command-runner';
import chalk from 'chalk';
import { userTextMessage } from '@agenite/llm';
import { prettyLogger } from '@agenite/pretty-logger';
export async function runAgent(userInput: string) {
  const systemPrompt = `You are an expert coding assistant. Your task is to help users with coding tasks by:
1. Reading and analyzing code files
2. Finding functions and imports
3. Making code modifications when requested
4. Providing explanations and suggestions
6. If you need to run multiple tools, you can do so by running the tools in sequence.

Always explain your thought process before taking actions.
`;

  const provider = getLLMProvider();

  const agent = new Agent({
    name: 'CodingAgent',
    description: 'An AI agent specialized in coding tasks',
    provider,
    instructions: systemPrompt,
    tools: [createFileSystemTool(), createCommandRunnerTool()],
    middlewares: [prettyLogger()],
  });

  printMessage('user', userInput);

  const response = await agent.execute({
    messages: [userTextMessage(userInput)],
  });

  console.log(chalk.green.bold('\n✅ Process Complete!'));
  // const tokens = response.tokenUsage;

  // // Pretty print the token usage
  // console.log(chalk.magenta.bold('\n📈 Token Usage:'));
  // console.log(chalk.magenta(JSON.stringify(tokens, null, 2)));
}
