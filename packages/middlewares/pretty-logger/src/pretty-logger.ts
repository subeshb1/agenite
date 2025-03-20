import { BaseAgeniteIterateGenerator, BaseNextValue } from '@agenite/agent';
import chalk from 'chalk';

export const prettyLogger = () => {
  return async function* (generator: BaseAgeniteIterateGenerator) {
    let result = await generator.next();
    let nextValue: BaseNextValue | undefined;

    while (!result.done) {
      // Return final result
      switch (result.value.type) {
        case 'agenite.llm-call.streaming':
          if (result.value.content.type === 'thinking') {
            if (result.value.content.isStart) {
              console.log(chalk.yellow.bold('\n🧠 Thinking:'));
              console.log(chalk.yellow('┌' + '─'.repeat(70) + '┐'));
            }
            process.stdout.write(chalk.yellow(result.value.content.thinking));
            if (result.value.content.isEnd) {
              console.log(chalk.yellow('\n└' + '─'.repeat(70) + '┘'));
            }
          } else if (result.value.content.type === 'text') {
            if (result.value.content.isStart) {
              console.log(chalk.green.bold('\n💡 Assistant:'));
              console.log(chalk.green('┌' + '─'.repeat(70) + '┐'));
            }
            process.stdout.write(chalk.green(result.value.content.text));
            if (result.value.content.isEnd) {
              console.log(chalk.green('\n└' + '─'.repeat(70) + '┘'));
            }
          } else if (result.value.content.type === 'toolUse') {
            console.log(chalk.cyan.bold('\n🛠️  Using Tool:'));
            console.log(chalk.cyan(JSON.stringify(result.value.content)));
          }
          break;
        case 'agenite.tool-result':
          console.log(chalk.cyan.bold('\n🛠️  Tool Result:'));
          console.log(chalk.cyan(JSON.stringify(result.value.output)));
          break;
        default:
          // console.log(result);
          break;
      }
      nextValue = yield result.value;

      result = await generator.next(nextValue);
    }
    return result.value;
  };
};
