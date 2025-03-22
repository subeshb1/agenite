import { userTextMessage } from '@agenite/llm';
import { deepResearchAgent } from './agents/deep-research-agent';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';

function printUsage() {
  console.log(`
Deep Research Agent - Create well-researched blog posts on any topic

Usage:
  npm start -- "your research query"
  # or
  pnpm start -- "your research query"

Example:
  npm start -- "What are the latest developments in quantum computing?"
  pnpm start -- "What is the current state of renewable energy?"
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

  console.log(
    '\n' + chalk.blue.bold('🔍 Starting research on:'),
    chalk.cyan(query)
  );

  console.log(chalk.gray('\nThis may take a few minutes...\n'));

  try {
    const iterator = deepResearchAgent.iterate({
      messages: [
        userTextMessage(`Research and write a blog post about: ${query}`),
      ],
    });

    let response = await iterator.next();
    while (!response.done) {
      switch (response.value.type) {
        case 'agenite.llm-call.streaming':
          if (response.value.content.type === 'thinking') {
            if (response.value.content.isStart) {
              console.log('<Reasoning>');
            }
            process.stdout.write(response.value.content.thinking);
            if (response.value.content.isEnd) {
              console.log('</Reasoning>');
            }
          } else if (response.value.content.type === 'toolUse') {
            // Handle tool use
            const toolUse = response.value.content.toolUse;
            switch (toolUse.name) {
              case 'web_search':
                console.log(
                  chalk.yellow(
                    `\n🔎 Searching the web for: "${(toolUse.input as { query: string }).query}"`
                  )
                );
                break;
              case 'web_scraper':
                console.log(
                  chalk.yellow(
                    `\n🔎 Investigating: "${(toolUse.input as { url: string }).url}"`
                  )
                );
                break;
              case 'file_manager':
                console.log(
                  chalk.yellow(
                    `\n💾 Writing the blog post to file: "${(toolUse.input as { filename: string }).filename}"`
                  )
                );
                break;
            }
          }
          break;

        case 'agenite.tool-result':
          if (response.value.result) {
            const result = response.value.result;
            if (
              response.value.toolUseBlock.name === 'web_search' &&
              result?.data
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
                const searchResults = JSON.parse(result.data as string);
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
            } else if (response.value.toolUseBlock.name === 'file_manager') {
              // Handle file manager and other tool results
              console.log(chalk.green(`\n✓ File written successfully`));
            } else {
              // For any other tools, display a generic success message
              console.log(
                chalk.green(`\n✓ Web investigation completed successfully`)
              );
            }
          }
          break;
      }
      response = await iterator.next();
    }

    console.log('\n' + chalk.green.bold('✨ Research completed successfully!'));

    const usage = response.value.tokenUsage;
    const usageTable = new Table({
      style: { head: ['cyan'] },
      head: ['Metric', 'Count'],
    });

    usageTable.push(
      ['Input Tokens', usage.inputTokens],
      ['Output Tokens', usage.outputTokens],
      ['Total Tokens', usage.inputTokens + usage.outputTokens]
    );

    console.log('\n' + chalk.blue.bold('📊 Token Usage:'));
    console.log(usageTable.toString());
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
