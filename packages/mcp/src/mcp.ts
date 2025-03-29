import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { Tool, JSONSchema } from '@agenite/tool';
import { MCPServerConfig, MCPToolCallResult } from './types';

interface ServerClient {
  client: Client;
  connected: boolean;
  serverConfig: MCPServerConfig;
}

export class MCPClient {
  private clients: Map<string, ServerClient> = new Map();
  private clientConfig: {
    name: string;
    version: string;
  };

  constructor(
    private config: {
      mcpServers: {
        [name: string]: MCPServerConfig;
      };
      name?: string;
      version?: string;
    }
  ) {
    this.clientConfig = {
      name: this.config.name || 'mcp-client',
      version: this.config.version || '1.0.0',
    };
    
    // Initialize clients for each server
    Object.entries(this.config.mcpServers).forEach(([name, serverConfig]) => {
      this.clients.set(name, {
        client: new Client(this.clientConfig),
        connected: false,
        serverConfig
      });
    });
  }

  /**
   * Connect to a specific MCP server
   * @private
   */
  private async connect(serverName: string): Promise<void> {
    const serverClient = this.clients.get(serverName);
    if (!serverClient) {
      throw new Error(`Server ${serverName} not found in configuration`);
    }

    if (serverClient.connected) return;

    const { serverConfig } = serverClient;
    let transport;

    if ('url' in serverConfig) {
      if (!serverConfig.url) {
        throw new Error('URL is required for SSE transport');
      }

      transport = new SSEClientTransport(new URL(serverConfig.url));
    } else if ('command' in serverConfig) {
      // Default to stdio transport
      if (!serverConfig.command || !serverConfig.args) {
        throw new Error('Command and args are required for stdio transport');
      }

      transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
      });
    }

    if (!transport) {
      throw new Error('Transport is required');
    }

    await serverClient.client.connect(transport);
    serverClient.connected = true;
  }

  /**
   * Connect to all configured MCP servers
   * @private
   */
  private async connectAll(): Promise<void> {
    const serverNames = Array.from(this.clients.keys());
    await Promise.all(serverNames.map(name => this.connect(name)));
  }

  /**
   * Get available tools from a specific MCP server
   */
  public async getTools(serverName: string): Promise<Tool[]> {
    const serverClient = this.clients.get(serverName);
    if (!serverClient) {
      throw new Error(`Server ${serverName} not found in configuration`);
    }

    if (!serverClient.connected) {
      await this.connect(serverName);
    }

    const toolList = await serverClient.client.listTools();

    return toolList.tools.map((toolSchema) => {
      return new Tool({
        name: `${serverName}.${toolSchema.name}`,
        description: toolSchema.description || '',
        inputSchema: toolSchema.inputSchema as JSONSchema,
        execute: async ({ input }) => {
          const result = await this.callTool(
            serverName,
            toolSchema.name,
            input as Record<string, unknown>
          );
          return result;
        },
      });
    });
  }

  /**
   * Get available tools from all connected MCP servers as a flat array
   * This is the preferred method for integration with Agent
   */
  public async getAllTools(): Promise<Tool[]> {
    await this.connectAll();
    const serverNames = Array.from(this.clients.keys());
    const toolPromises = serverNames.map(name => this.getTools(name));
    
    const results = await Promise.all(toolPromises);
    return results.flat();
  }

  /**
   * Get available tools from all connected MCP servers organized by server
   */
  public async getAllToolsByServer(): Promise<{[serverName: string]: Tool[]}> {
    await this.connectAll();
    const serverNames = Array.from(this.clients.keys());
    const toolsPromises = serverNames.map(async (name) => {
      const tools = await this.getTools(name);
      return [name, tools];
    });
    
    const results = await Promise.all(toolsPromises);
    return Object.fromEntries(results);
  }

  /**
   * Call a tool on a specific MCP server
   * @private This is internally used by the Tool execute functions
   */
  private async callTool(
    serverName: string,
    toolName: string,
    input?: Record<string, unknown>
  ): Promise<MCPToolCallResult> {
    const serverClient = this.clients.get(serverName);
    if (!serverClient) {
      throw new Error(`Server ${serverName} not found in configuration`);
    }

    if (!serverClient.connected) {
      await this.connect(serverName);
    }

    const result = await serverClient.client.callTool({
      name: toolName,
      arguments: input,
    });

    return {
      isError: !!result.isError,
      data: result.content as string,
    };
  }

  /**
   * Get configured server names
   */
  public getServerNames(): string[] {
    return Array.from(this.clients.keys());
  }
}
