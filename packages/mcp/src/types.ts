/**
 * Configuration for MCP server
 */
export type MCPServerConfig = MCPSSEConfig | MCPStdioConfig;

export interface MCPSSEConfig {
  /**
   * URL for SSE transport
   */
  url: string;
}

export interface MCPStdioConfig {
  /**
   * Command to execute the MCP server
   */
  command: string;

  /**
   * Arguments for the command
   */
  args?: string[];

  /**
   * Environment variables for the command
   */
  env?: Record<string, string>;

  /**
   * Working directory for the command
   */
  cwd?: string;
}

/**
 * Definition of a tool provided by MCP server
 */
export interface MCPToolDefinition {
  /**
   * Name of the tool
   */
  name: string;

  /**
   * Description of the tool
   */
  description?: string;

  /**
   * JSON schema for the tool input
   */
  inputSchema: Record<string, unknown>;
}

/**
 * Result of a tool call from MCP server
 */
export interface MCPToolCallResult {
  /**
   * Whether the call resulted in an error
   */
  isError: boolean;

  /**
   * Data returned from the tool call
   */
  data: string;
}
