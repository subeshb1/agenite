import { Tool } from '@agenite/tool';
import puppeteer from 'puppeteer';

interface WebSearchInput {
  query: string;
  limit?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchDuckDuckGo(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const browser = await puppeteer.launch({
    headless: false,
  });

  try {
    const page = await browser.newPage();

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to DuckDuckGo
    await page.goto('https://duckduckgo.com/?q=' + encodeURIComponent(query), {
      waitUntil: 'networkidle0',
    });

    // Wait for search results to load and get proper selectors
    await page.waitForSelector('article[data-testid="result"]');
    // Extract search results
    const results = await page.evaluate((resultLimit) => {
      const searchResults: SearchResult[] = [];
      const resultElements = Array.from(
        document.querySelectorAll('article[data-testid="result"]')
      );

      resultElements.slice(0, resultLimit).forEach((result) => {
        if (!result) return;

        const titleElement = result.querySelector(
          '[data-testid="result-title-a"]'
        );
        const linkElement = result.querySelector(
          '[data-testid="result-title-a"]'
        );
        const snippetElement = result.querySelector('[data-result="snippet"]');

        searchResults.push({
          title: titleElement?.textContent?.trim() || '',
          url: linkElement?.getAttribute('href') || '',
          snippet: snippetElement?.textContent?.trim() || '',
        });
      });

      return searchResults;
    }, limit);

    console.log('Search Results:', JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('DuckDuckGo search failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

export const webSearchTool = new Tool<WebSearchInput>({
  name: 'web_search',
  description: 'Simple DuckDuckGo search that returns top results',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number' },
    },
    required: ['query'],
  },
  execute: async ({ input }) => {
    const { query, limit = 5 } = input;

    try {
      const results = await searchDuckDuckGo(query, limit);

      return {
        success: true,
        data: JSON.stringify(
          {
            results,
            metadata: {
              query,
              totalResults: results.length,
              searchDate: new Date().toISOString(),
            },
          },
          null,
          2
        ),
      };
    } catch (error) {
      return {
        success: false,
        data: `Failed to search: ${error}`,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
