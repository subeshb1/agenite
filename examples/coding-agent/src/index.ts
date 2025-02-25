import { runAgent } from './agent';
import chalk from 'chalk';

async function main() {
  // Get command line arguments (args[0] is node, args[1] is script path)
  const args = process.argv.slice(2);
  
  // Join all arguments into a single prompt string
  const prompt = args.join(' ');
  
  if (!prompt) {
    console.log(chalk.red.bold('⚠️  Error: No prompt provided'));
    console.log(chalk.white('Please provide a prompt. Example:'));
    console.log(chalk.green('  pnpm start "Create a snake game using html, css and javascript"'));
    console.log(chalk.cyan('\nAvailable commands:'));
    console.log(chalk.yellow('- Create new projects or files'));
    console.log(chalk.yellow('- Analyze existing code'));
    console.log(chalk.yellow('- Modify or debug code'));
    console.log(chalk.yellow('- Answer coding questions'));
    process.exit(1);
  }
  
  console.log(chalk.magenta.bold('\n🤖 Coding Agent Starting...'));
  console.log(chalk.white('Your prompt: ') + chalk.cyan.italic(prompt));
  console.log(chalk.gray('═'.repeat(80)));
  
  // Run the agent with the provided prompt
  await runAgent(prompt);
}

main().catch(error => {
  console.error(chalk.red.bold('\n❌ Error occurred:'));
  console.error(chalk.red(error.stack || error.message || error));
  process.exit(1);
}); 
