import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from '@agenite/tool';

interface FileSystemInput {
  operation: 'read' | 'write' | 'list' | 'exists' | 'mkdir';
  path: string;
  content?: string;
}

export function createFileSystemTool(): Tool<FileSystemInput> {
  return new Tool({
    name: 'file_system',
    description:
      'Read, write, and check files in the project. Can create both files and directories',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['read', 'write', 'list', 'exists', 'mkdir'],
        },
        path: { type: 'string', description: 'relative path to the file' },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['operation', 'path'],
    },

    async execute({ input }) {
      const startTime = Date.now();

      const rootPath = process.cwd() + '/' + 'output';
      const fullPath = rootPath + '/' + input.path;
      try {
        switch (input.operation) {
          case 'read': {
            const content = await fs.readFile(fullPath, 'utf-8');
            return {
              isError: false,
              data: content,
              duration: Date.now() - startTime,
            };
          }

          case 'write': {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, input.content || '');
            return {
              isError: false,
              data: `File written to ${input.path}`,
              duration: Date.now() - startTime,
            };
          }

          case 'list': {
            const files = await fs.readdir(fullPath, { recursive: true });
            return {
              isError: false,
              data: files.join('\n'),
              duration: Date.now() - startTime,
            };
          }

          case 'exists': {
            try {
              await fs.access(input.path);
              return {
                isError: false,
                data: 'true',
                duration: Date.now() - startTime,
              };
            } catch {
              return {
                isError: false,
                data: 'false',
                duration: Date.now() - startTime,
              };
            }
          }

          case 'mkdir': {
            await fs.mkdir(fullPath, { recursive: true });
            return {
              isError: false,
              data: `Directory created at ${input.path}`,
              duration: Date.now() - startTime,
            };
          }

          default:
            return {
              isError: true,
              data: `Unknown operation: ${input.operation}`,
              duration: Date.now() - startTime,
            };
        }
      } catch (error) {
        return {
          isError: true,
          data: error instanceof Error ? `${error.message}` : 'Unknown error',
          duration: Date.now() - startTime,
        };
      }
    },
  });
}
