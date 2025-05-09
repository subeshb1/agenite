/* eslint-disable no-control-regex */
import { Tool } from '@agenite/tool';
import puppeteerExtra from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(Stealth());

interface WebScraperInput {
  url: string;
  debug?: boolean;
}

interface ExtractedInformation {
  url: string;
  title: string;
  content: string;
}

class ContentExtractor {
  private debug: boolean;

  constructor(debug = true) {
    this.debug = debug;
  }

  private log(_message: string) {}

  async extract(url: string): Promise<ExtractedInformation> {
    if (!url) {
      throw new Error('URL is required');
    }
    const browserObj = await puppeteerExtra.launch({
      headless: !this.debug,
      devtools: true,
    });

    this.log(`Starting extraction for ${url}`);

    try {
      const page = await browserObj.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36'
      );

      this.log('Navigating to page...');
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      this.log('Extracting content...');

      const information = await page.evaluate(() => {
        // Remove unwanted elements
        const removeSelectors = [
          'nav',
          'header',
          'footer',
          '.nav',
          '.header',
          '.footer',
          '.sidebar',
          '.menu',
          '.ad',
          '.ads',
          '.advertisement',
          '.social-share',
          '.comments',
          '#comments',
          '.related-posts',
          'script',
          'style',
          'iframe',
          'form',
          'button',
        ];

        removeSelectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });

        return {
          title: document.title
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .replace(/\s+/g, ' ') // Normalize whitespace,
            .trim(),
          content: document.body.innerText
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .replace(/\s+/g, ' ') // Normalize whitespace,
            .trim(),
        };
      });

      this.log('Content extracted successfully');

      return {
        url,
        ...information,
      };
    } catch (error) {
      this.log('Error during extraction');
      throw error;
    } finally {
      await browserObj.close();
    }
  }
}

export const webScraperTool = new Tool<WebScraperInput>({
  name: 'web_scraper',
  description: 'Extracts title and content from web pages',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
    },
    required: ['url'],
  },
  execute: async ({ input }) => {
    if (!input?.url) {
      return {
        isError: true,
        data: 'URL is required',
        error: {
          code: 'INVALID_INPUT',
          message: 'URL is required',
        },
      };
    }

    try {
      const extractor = new ContentExtractor(true);
      const information = await extractor.extract(input.url);

      return {
        isError: false,
        data: JSON.stringify(information, null, 2),
      };
    } catch (error) {
      return {
        isError: true,
        data: `Failed to extract information: ${error}`,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
