import { Tool, ToolResponse } from '../agent/types';
import { VectorStore } from '../vector-store';

export interface RAGToolConfig {
  name?: string;
  description?: string;
  vectorStore: VectorStore;
  maxResults?: number;
}

const defaultConfig: Partial<RAGToolConfig> = {
  name: 'search',
  description: 'Search through documents to find relevant information',
  maxResults: 3,
};

export function createRAGTool(config: RAGToolConfig): Tool {
  const finalConfig = { ...defaultConfig, ...config };

  return {
    name: finalConfig.name!,
    description: finalConfig.description!,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },

    async execute({
      input,
    }: {
      input: { query: string };
    }): Promise<ToolResponse> {
      try {
        const results = await finalConfig.vectorStore.search(
          input.query,
          finalConfig.maxResults,
        );

        if (results.length === 0) {
          return {
            success: true,
            data: 'No relevant documents found.',
          };
        }

        const formattedResults = results
          .map(
            (result, index) =>
              `[${index + 1}] (Score: ${result.score.toFixed(2)})\n${result.document.content}\n`,
          )
          .join('\n');

        return {
          success: true,
          data: formattedResults,
        };
      } catch (error) {
        return {
          success: false,
          data: error instanceof Error ? error.message : 'Search failed',
        };
      }
    },
  };
}
