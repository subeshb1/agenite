import { Tool } from '@agenite/tool';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FileManagerInput {
  action: 'read' | 'write';
  type: 'topics' | 'details' | 'blog';
  content?: string;
  filename?: string;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export const fileManagerTool = new Tool<FileManagerInput>({
  name: 'file_manager',
  description:
    'Read or write research data to files in the appropriate directories',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['read', 'write'],
      },
      type: {
        type: 'string',
        enum: ['topics', 'details', 'blog'],
      },
      content: {
        type: 'string',
      },
      filename: {
        type: 'string',
      },
    },
    required: ['action', 'type'],
  },
  execute: async ({ input }) => {
    const { action, type, content, filename } = input;

    try {
      // Get the appropriate directory
      const baseDir = process.cwd();
      const dirPaths = {
        topics: path.join(baseDir, 'research', 'topics'),
        details: path.join(baseDir, 'research', 'details'),
        blog: path.join(baseDir, 'research', 'blogs'),
      };

      const dirPath = dirPaths[type];
      await ensureDirectoryExists(dirPath);

      if (action === 'write') {
        if (!content) {
          throw new Error('Content is required for write action');
        }

        // Generate filename if not provided
        const actualFilename =
          filename || `${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filePath = path.join(
          dirPath,
          actualFilename.replace(dirPath, '')
        );

        // Write the file
        await fs.writeFile(filePath, content, 'utf8');

        return {
          success: true,
          data: JSON.stringify({
            message: 'File written successfully',
            filePath,
            type,
          }),
        };
      } else {
        // read
        if (!filename) {
          throw new Error('Filename is required for read action');
        }

        const filePath = path.join(dirPath, filename.replace(dirPath, ''));
        const content = await fs.readFile(filePath, 'utf8');

        return {
          success: true,
          data: content,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: `File operation failed: ${error}`,
        error: {
          code: 'FILE_OPERATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
