import { printMessage } from '@agenite-examples/llm-provider';
import { deepResearchAgent } from './agents/deep-research-agent';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';

interface ResearchAgentInput {
  query: string;
  style?: {
    tone?: 'technical' | 'conversational' | 'educational';
    format?: 'long-form' | 'listicle' | 'tutorial';
  };
}

function printUsage() {
  console.log(`
Deep Research Agent - Create well-researched blog posts on any topic

Usage:
  npm start -- "your research query" [options]
  # or
  pnpm start -- "your research query" [options]

Example:
  npm start -- "What are the latest developments in quantum computing?"
  pnpm start -- "What is the current state of renewable energy?" --tone technical

Options:
  --tone     : technical | conversational | educational (default: educational)
  --format   : long-form | listicle | tutorial (default: long-form)
  `);
}

async function main() {
  // Get query from command line arguments
  const query = process.argv[2];

  // delete the research folder
  const researchDir = path.join(process.cwd(), 'research');
  if (fs.existsSync(researchDir)) {
    fs.rmSync(researchDir, { recursive: true, force: true });
  }

  // Show usage if no query provided
  if (!query) {
    printUsage();
    process.exit(1);
  }

  // Parse style options from command line
  const style = {
    tone: process.argv.includes('--tone')
      ? process.argv[process.argv.indexOf('--tone') + 1]
      : 'educational',
    format: process.argv.includes('--format')
      ? process.argv[process.argv.indexOf('--format') + 1]
      : 'long-form',
  };

  console.log(
    '\n' + chalk.blue.bold('🔍 Starting research on:'),
    chalk.cyan(query)
  );
  console.log(
    chalk.blue('Style preferences:'),
    chalk.cyan(JSON.stringify(style, null, 2))
  );
  console.log(chalk.gray('\nThis may take a few minutes...\n'));

  try {
    const iterator = deepResearchAgent.iterate({
      input: `Research and write a blog post about: ${query}
Style preferences: ${JSON.stringify(style, null, 2)}`,
      stream: true,
    });

    let response = await iterator.next();
    while (!response.done) {
      switch (response.value.type) {
        case 'streaming':
          if (response.value.response.type === 'text') {
            process.stdout.write(chalk.cyan(response.value.response.text));
          } else {
            // Handle tool use
            const toolUse = response.value.response.toolUse;
            if (toolUse.name === 'web_search') {
              console.log(
                chalk.yellow(
                  `\n🔎 Searching the web for: "${(toolUse.input as { query: string }).query}"`
                )
              );
            } else {
              console.log(chalk.yellow(`\n🛠 Using tool ${toolUse.name}`));
            }
          }
          break;

        case 'toolResult':
          if (response.value.results && response.value.results.length > 0) {
            const result = response.value.results[0];
            if (
              result?.result?.toolName === 'web_search' &&
              result?.result?.content
            ) {
              console.log(
                '\n' + chalk.green.bold('📚 Found relevant resources:')
              );
              const table = new Table({
                style: { head: ['cyan'] },
                head: ['Title', 'URL', 'Snippet'],
                colWidths: [40, 50, 50],
                wordWrap: true,
              });

              try {
                const searchResults = JSON.parse(
                  result.result.content as string
                );
                searchResults.results.forEach(
                  (searchResult: {
                    title: string;
                    url: string;
                    snippet: string;
                  }) => {
                    table.push([
                      chalk.white(searchResult.title),
                      chalk.gray(searchResult.url),
                      chalk.yellow(searchResult.snippet),
                    ]);
                  }
                );

                console.log(table.toString());
                console.log(
                  chalk.gray(
                    `\nTotal results: ${searchResults.metadata.totalResults}`
                  )
                );
                console.log(
                  chalk.gray(
                    `Search date: ${new Date(searchResults.metadata.searchDate).toLocaleString()}`
                  )
                );
              } catch {
                console.log(chalk.red('Error parsing search results'));
              }
            } else {
              // Handle file manager and other tool results
              if (result?.result?.toolName === 'file_manager') {
                const fileResult = JSON.parse(
                  result.result.content as string
                ) as {
                  action: 'write' | 'read' | 'delete';
                  path: string;
                  success: boolean;
                  message?: string;
                };

                if (fileResult.action === 'write') {
                  console.log(
                    chalk.green('\n💾 Saved research output:'),
                    chalk.gray(fileResult.path)
                  );
                  if (fileResult.message) {
                    console.log(chalk.gray(fileResult.message));
                  }
                } else if (fileResult.action === 'read') {
                  console.log(
                    chalk.green('\n📖 Reading from file:'),
                    chalk.gray(fileResult.path)
                  );
                  if (fileResult.message) {
                    console.log(chalk.white(fileResult.message));
                  }
                } else if (fileResult.action === 'delete') {
                  console.log(
                    chalk.yellow('\n🗑️  Deleted file:'),
                    chalk.gray(fileResult.path)
                  );
                  if (fileResult.message) {
                    console.log(chalk.gray(fileResult.message));
                  }
                }
              } else {
                // For any other tools, display a generic success message
                console.log(
                  chalk.green(
                    `\n✓ Tool ${result?.result?.toolName} completed successfully`
                  )
                );
              }
            }
          }
          break;
      }
      response = await iterator.next();
    }

    console.log('\n' + chalk.green.bold('✨ Research completed successfully!'));

    console.log('\n' + chalk.magenta.bold('📝 Generated Blog Post:'));
    console.log(chalk.white(JSON.stringify(response.value.messages, null, 2)));

    const usage = response.value.tokenUsage;
    const usageTable = new Table({
      style: { head: ['cyan'] },
      head: ['Metric', 'Count'],
    });

    usageTable.push(
      ['Input Tokens', usage.total.inputTokens],
      ['Output Tokens', usage.total.outputTokens],
      ['Total Tokens', usage.total.inputTokens + usage.total.outputTokens]
    );

    console.log('\n' + chalk.blue.bold('📊 Token Usage:'));
    console.log(usageTable.toString());
    console.log(JSON.stringify(response.value.tokenUsage, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('\n' + chalk.red.bold('❌ Research failed'));
    console.error(chalk.red('Error details:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}
