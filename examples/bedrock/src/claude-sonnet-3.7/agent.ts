import { Agent } from '@agenite/agent';
import { BedrockProvider } from '@agenite/bedrock';
import { printMessage } from '@agenite-examples/llm-provider';
import chalk from 'chalk';

const agent = new Agent({
  provider: new BedrockProvider({
    model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: 'us-east-2',
    enableReasoning: true,
    reasoningBudgetTokens: 4000,
  }),
  name: 'Super Agent',
});

const userInput = `How many r's are in the word strawberry?"`
const iterator = agent.iterate({
  input: userInput,
  stream: true,
});

let response = await iterator.next();

console.log(chalk.green.bold('\n💡 User Input:'));
console.log(chalk.blueBright(userInput));

while (!response.done) {
  switch (response.value.type) {
    case 'streaming':
      if (response.value.response.type === 'thinking') {
        if (response.value.response.isStart) {
          console.log(chalk.yellow.bold('\n🧠 Thinking:'));
          console.log(chalk.yellow('┌' + '─'.repeat(70) + '┐'));
        }
        process.stdout.write(chalk.yellow(response.value.response.thinking));
        if (response.value.response.isEnd) {
          console.log(chalk.yellow('\n└' + '─'.repeat(70) + '┘'));
        }
      } else if (response.value.response.type === 'text') {
        if (response.value.response.isStart) {
          console.log(chalk.green.bold('\n💡 Assistant:'));
          console.log(chalk.green('┌' + '─'.repeat(70) + '┐'));
        }
        process.stdout.write(chalk.green(response.value.response.text));
        if (response.value.response.isEnd) {
          console.log(chalk.green('\n└' + '─'.repeat(70) + '┘'));
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
