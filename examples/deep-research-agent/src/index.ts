import { printMessage } from '@agenite-examples/llm-provider';
import { blogOrchestratorAgent } from './orchestrator/blog-orchestrator';
import fs from 'fs';
import path from 'path';

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

  console.log('\n🔍 Starting research on:', query);
  console.log('Style preferences:', style);
  console.log('\nThis may take a few minutes...\n');

  try {
    const iterator = blogOrchestratorAgent.iterate({
      input: `Research and write a blog post about: ${query}
Style preferences: ${JSON.stringify(style, null, 2)}`,
      stream: true,
    });

    let response = await iterator.next();
    while (!response.done) {
      switch (response.value.type) {
        case 'streaming':
          if (response.value.response.type === 'text') {
            process.stdout.write(response.value.response.text);
          } else {
            printMessage(
              'tool',
              [response.value.response.toolUse],
              response.value.agentName
            );
          }
          break;

        case 'toolResult':
          printMessage(
            'toolResult',
            response.value.results.map((r) => r.result),
            response.value.agentName
          );
          break;
      }
      response = await iterator.next();
    }

    console.log('\n✨ Research completed!\n');
    console.log('📝 Final blog post:', response.value.messages);
    console.log('\n📊 Token usage:', response.value.tokenUsage);
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}
