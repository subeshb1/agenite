import { Tool } from '@agenite/tool';
import puppeteer from 'puppeteer';

interface WebScraperInput {
  url: string;
  debug?: boolean;
}

interface ExtractedInformation {
  url: string;
  title: string;
  summary: string;
  mainPoints: string[];
  topics: string[];
  content: {
    sections: Array<{
      title: string;
      content: string;
      importance: number;
    }>;
    facts: string[];
    definitions: string[];
    statistics: string[];
  };
  metadata: {
    author?: string;
    date?: string;
    lastModified?: string;
    estimatedReadTime: number;
    wordCount: number;
    type: 'article' | 'blog' | 'news' | 'documentation' | 'other';
  };
  references: Array<{
    text: string;
    url?: string;
  }>;
}

class ContentExtractor {
  private debug: boolean;

  constructor(debug = true) {
    this.debug = debug;
  }

  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`🔍 [WebScraper] ${message}`);
      if (data) console.log(data);
    }
  }

  async extract(url: string): Promise<ExtractedInformation> {
    this.log(`Starting extraction for ${url}`);

    const browser = await puppeteer.launch({
      headless: this.debug ? false : true,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Enable console logging from the page
      if (this.debug) {
        page.on('console', (msg) => console.log('Page log:', msg.text()));
        page.on('error', (err) => console.error('Page error:', err));
        page.on('pageerror', (err) => console.error('Page error:', err));
      }

      // Set a realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36'
      );

      this.log('Navigating to page...');
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      this.log('Page loaded, extracting information...');
      const information = await page.evaluate(() => {
        function cleanText(text: string): string {
          return text.trim().replace(/\\s+/g, ' ').replace(/\\n+/g, ' ');
        }

        // Helper to get text importance score (0-1)
        function getImportance(text: string, element: Element): number {
          const factors = {
            length: Math.min(text.length / 1000, 1),
            headerProximity: element.closest('h1,h2,h3') ? 0.8 : 0.3,
            emphasis: /strong|em|b|i|mark|important|key|main/i.test(
              element.innerHTML
            )
              ? 0.7
              : 0.3,
            location: element.closest('article,main') ? 0.8 : 0.4,
            density: text.split(/[.!?]/).length / text.length,
          };
          return (
            Object.values(factors).reduce((a, b) => a + b) /
            Object.keys(factors).length
          );
        }

        // Remove unwanted elements before processing
        function cleanDocument() {
          const unwanted =
            'script,style,nav,header,footer,aside,iframe,noscript,svg,canvas,button,input,form';
          document.querySelectorAll(unwanted).forEach((el) => el.remove());
        }

        // Clean the document first
        cleanDocument();

        // Get all text content
        const allText = document.body.textContent || '';
        const wordCount = allText.split(/\\s+/).length;

        // Extract main content sections
        const sections = Array.from(document.querySelectorAll('h1,h2,h3'))
          .map((heading) => {
            let content = '';
            let node = heading.nextElementSibling;
            const contentNodes = [];

            while (node && !['H1', 'H2', 'H3'].includes(node.tagName)) {
              if (node.textContent?.trim()) {
                contentNodes.push(node);
              }
              node = node.nextElementSibling;
            }

            content = contentNodes
              .map((node) => cleanText(node.textContent || ''))
              .join(' ');

            return {
              title: cleanText(heading.textContent || ''),
              content: content.trim(),
              importance: getImportance(content, heading),
            };
          })
          .filter((section) => section.content.length > 100);

        // Extract facts and statistics
        function extractSentences(text: string, pattern: RegExp): string[] {
          const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
          return sentences
            .filter((sentence) => pattern.test(sentence))
            .map(cleanText)
            .filter(
              (sentence) => sentence.length > 20 && sentence.length < 200
            );
        }

        const facts = extractSentences(
          allText,
          /(?:[0-9]+(?:[.,][0-9]+)?%?|in [0-9]{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* [0-9]{1,2}|approximately|estimated|according to|studies show|research indicates)/i
        );

        const definitions = extractSentences(
          allText,
          /\b(?:is|are|means|refers to|defined as|can be described as)\b/i
        );

        const statistics = extractSentences(
          allText,
          /(?:[0-9]+(?:[.,][0-9]+)?%?|million|billion|trillion)/i
        );

        // Extract main points from paragraphs
        const paragraphs = Array.from(document.querySelectorAll('p'));
        const mainPoints = paragraphs
          .map((p) => ({
            text: cleanText(p.textContent || ''),
            importance: getImportance(p.textContent || '', p),
          }))
          .filter((point) => point.importance > 0.7)
          .map((point) => point.text)
          .slice(0, 5);

        // Generate topics
        const topicElements = document.querySelectorAll(
          'h1,h2,h3,strong,em,b,mark'
        );
        const topics = [
          ...new Set(
            Array.from(topicElements)
              .map((el) => cleanText(el.textContent || ''))
              .filter((topic) => topic.length > 3 && topic.length < 50)
          ),
        ].slice(0, 10);

        // Extract references
        const references = [
          ...Array.from(document.querySelectorAll('a[href]')).map((a) => ({
            text: cleanText(a.textContent || ''),
            url: a.getAttribute('href'),
          })),
          ...Array.from(document.querySelectorAll('cite')).map((cite) => ({
            text: cleanText(cite.textContent || ''),
          })),
        ].filter((ref) => ref.text.length > 0);

        // Generate summary
        const firstPara = cleanText(
          document.querySelector('p')?.textContent || ''
        );
        const summary =
          firstPara.length > 100 ? firstPara : mainPoints[0] || '';

        // Determine content type
        function getContentType():
          | 'article'
          | 'blog'
          | 'news'
          | 'documentation'
          | 'other' {
          const url = window.location.href;
          const content = document.body.textContent || '';

          if (
            url.includes('blog') ||
            content.includes('posted on') ||
            content.includes('author')
          )
            return 'blog';
          if (
            url.includes('news') ||
            content.includes('published') ||
            content.includes('reporter')
          )
            return 'news';
          if (
            url.includes('docs') ||
            content.includes('documentation') ||
            content.includes('reference')
          )
            return 'documentation';
          if (content.includes('article') || sections.length > 3)
            return 'article';
          return 'other';
        }

        return {
          url: window.location.href,
          title: document.title || sections[0]?.title || '',
          summary,
          mainPoints,
          topics,
          content: {
            sections,
            facts,
            definitions,
            statistics,
          },
          metadata: {
            author: document
              .querySelector('[rel="author"], .author')
              ?.textContent?.trim(),
            date:
              document
                .querySelector('time, [datetime], .date')
                ?.getAttribute('datetime') ||
              document
                .querySelector('time, [datetime], .date')
                ?.textContent?.trim(),
            lastModified: document.lastModified,
            estimatedReadTime: Math.ceil(wordCount / 200),
            wordCount,
            type: getContentType(),
          },
          references: references.slice(0, 20),
        };
      });

      this.log('Information extracted successfully', information);
      return information;
    } catch (error) {
      this.log('Error during extraction:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}

export const webScraperTool = new Tool<WebScraperInput>({
  name: 'web_scraper',
  description:
    'Intelligently extracts and analyzes content from web pages, identifying key information, facts, and structure',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      debug: { type: 'boolean' },
    },
    required: ['url'],
  },
  execute: async ({ input }) => {
    try {
      const extractor = new ContentExtractor(input.debug);
      const information = await extractor.extract(input.url);

      return {
        success: true,
        data: JSON.stringify(information, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        data: `Failed to extract information: ${error}`,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
