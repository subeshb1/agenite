import { Agent } from '@agenite/agent';
import { getLLMProvider, printMessage } from '@agenite-examples/llm-provider';
import { createFileSystemTool } from './tools/file-system';
import { createCommandRunnerTool } from './tools/command-runner';
import chalk from 'chalk';

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
    systemPrompt,

    tools: [createFileSystemTool(), createCommandRunnerTool()],
  });

  printMessage('user', userInput);

  const iterator = agent.iterate({
    input: userInput,
    stream: true,
  });

  let response = await iterator.next();
  printMessage('assistant', '');

  while (!response.done) {
    switch (response.value.type) {
      case 'streaming':
        if (response.value.response.type === 'reasoning') {
          if (response.value.response.isStart) {
            console.log(chalk.yellow.bold('\n🧠 Reasoning:'));
            console.log(chalk.yellow('┌' + '─'.repeat(150) + '┐'));
          }
          process.stdout.write(chalk.yellow(response.value.response.reasoning));
          if (response.value.response.isEnd) {
            console.log(chalk.yellow('\n└' + '─'.repeat(150) + '┘'));
          }
        } else if (response.value.response.type === 'text') {
          if (response.value.response.isStart) {
            console.log(chalk.green.bold('\n💡 Assistant:'));
            console.log(chalk.green('┌' + '─'.repeat(150) + '┐'));
          }
          process.stdout.write(chalk.green(response.value.response.text));
          if (response.value.response.isEnd) {
            console.log(chalk.green('\n└' + '─'.repeat(150) + '┘'));
          }
        } else if (response.value.response.type === 'toolUse') {
          console.log(chalk.cyan.bold('\n🛠️  Using Tool:'));
          printMessage('tool', [response.value.response.toolUse]);
        }

        break;

      case 'toolResult':
        console.log(chalk.blue.bold('\n📊 Tool Result:'));
        printMessage(
          'toolResult',
          response.value.results.map((r) => r.result)
        );
        break;
    }
    response = await iterator.next();
  }

  console.log(chalk.green.bold('\n✅ Process Complete!'));
  // printMessage('assistant', JSON.stringify(response, null, 2));
}
