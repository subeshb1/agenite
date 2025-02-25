import { Tool, ToolResponse } from '@agenite/tool';
import { spawn } from 'child_process';

interface CommandInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

export function createCommandRunnerTool(): Tool<CommandInput> {
  const commandCache = new Map<
    string,
    {
      data: string;
      timestamp: number;
      success: boolean;
    }
  >();

  return new Tool({
    name: 'command_runner',
    description:
      'Executes shell commands on the system. Use with caution as improper commands can cause unintended behavior.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description:
            'The command to execute. Ensure it is a valid shell command.',
        },
        cwd: {
          type: 'string',
          description: 'Optional working directory for the command.',
        },
        timeout: {
          type: 'number',
          description: 'Optional timeout in milliseconds (default: 30,000 ms).',
        },
      },
      required: ['command'],
    },

    async execute({ input }) {
      const startTime = Date.now();
      const cacheKey = `${input.command}-${input.cwd || ''}-${input.timeout || 30000}`;

      // Validate command input
      if (!input.command || typeof input.command !== 'string') {
        return {
          success: false,
          data: 'Invalid command input. Must be a non-empty string.',
          duration: 0,
        };
      }

      // Check cache for recent execution results
      const cached = commandCache.get(cacheKey);
      if (cached && startTime - cached.timestamp < 60000) {
        return {
          success: cached.success,
          data: cached.data,
          duration: 0,
        };
      }

      return new Promise<ToolResponse>((resolve) => {
        let output = '';
        let errorOutput = '';

        const [cmd, ...args] = input.command.split(' ');
        const child = spawn(cmd, args, {
          cwd: process.cwd() + '/' + 'output',
          shell: true,
        });

        const timeout = input.timeout || 30000;
        const timer = setTimeout(() => {
          child.kill('SIGTERM');
          resolve({
            success: false,
            data: 'Command timed out',
            duration: Date.now() - startTime,
          });
        }, timeout);

        // Collect stdout
        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        // Collect stderr
        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        // On command completion
        child.on('close', (code) => {
          clearTimeout(timer);
          const result = {
            success: code === 0,
            data: (output || errorOutput || 'No output captured').replace(
              process.cwd() + '/output',
              ''
            ),
            duration: Date.now() - startTime,
          };

          // Cache result
          commandCache.set(cacheKey, {
            data: result.data,
            timestamp: startTime,
            success: result.success,
          });

          resolve(result);
        });

        // Catch errors with the subprocess
        child.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            success: false,
            data: `Error executing command: ${err.message}`,
            duration: Date.now() - startTime,
          });
        });
      }).catch((err) => {
        console.error('Unexpected error:', err);
        return {
          success: false,
          data: 'Unexpected error while executing the command',
          duration: Date.now() - startTime,
        };
      });
    },
  });
}
