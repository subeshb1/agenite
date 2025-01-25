import { createAgent } from '../agent/agent';
import { createClaudeProvider } from '../provider/claude';
import { createDefaultLogger } from '../../logger/default-logger';
import { InMemoryVectorStore, Embedder } from '../vector-store';
import { createRAGTool } from './rag-tool';

// Example embedder implementation (you'd want to use a real embedding service)
class DummyEmbedder implements Embedder {
  async embed(_text: string): Promise<number[]> {
    return Array(384)
      .fill(0)
      .map(() => Math.random());
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() =>
      Array(384)
        .fill(0)
        .map(() => Math.random()),
    );
  }
}

async function main() {
  // Initialize vector store with documents
  const vectorStore = new InMemoryVectorStore(new DummyEmbedder());
  await vectorStore.addDocuments([
    {
      id: '1',
      content:
        'The capital of France is Paris. It is known for the Eiffel Tower.',
    },
    {
      id: '2',
      content:
        'The capital of Japan is Tokyo. It is the most populous metropolitan area in the world.',
    },
  ]);

  // Create RAG tool
  const ragTool = createRAGTool({
    vectorStore,
    name: 'search',
    description: 'Search through knowledge base to find relevant information',
  });

  // Create agent with RAG capability
  const agent = createAgent({
    name: 'RAGAgent',
    provider: createClaudeProvider({}),
    systemPrompt: `You are a helpful assistant with access to a knowledge base. 
    When asked questions, use the search tool to find relevant information before responding.
    Always cite your sources from the search results.`,
    tools: [ragTool],
    logger: createDefaultLogger(),
  });

  // Test the agent
  const result = await agent.execute({
    messages: 'What is the capital of France and what is it known for?',
    stream: true,
  });

  console.log('Final result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
