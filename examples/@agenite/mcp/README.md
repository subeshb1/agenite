# MCP (Model Context Protocol) Example

This example demonstrates how to use the Model Context Protocol (MCP) with Agenite agents.

## What is MCP?

The Model Context Protocol (MCP) is a standard for integrating external tools with language models. It allows you to connect to MCP-compatible servers and use their tools with Agenite agents.

## Prerequisites

- Node.js 18+
- Agenite installed

## Installation

```bash
npm install
```

## Usage

This example shows how to:

1. Configure MCP servers
2. Get tools from these servers
3. Pass these tools to an Agenite agent
4. Execute the agent with the tools

## Basic Example

See `src/basic.ts` for a complete example. Here's the key part:

```typescript
// Initialize MCP client
const mcpClient = new MCPClient({
  name: 'mcp-example',
  mcpServers: {
    // Example server with local Ollama
    'ollama': {
      command: 'ollama',
      args: ['serve'],
      env: { 'OLLAMA_HOST': 'localhost:11434' }
    },
    // Example server with remote API
    'api-server': {
      url: 'https://api.example.com/mcp-endpoint'
    }
  }
});

// Get all tools as a flat array
// This automatically connects to the servers
const tools = await mcpClient.getAllTools();

// Create an agent with the MCP tools
const agent = new Agent({
  name: 'mcp-enabled-agent',
  provider: new OllamaProvider({ 
    model: 'llama3',
    baseURL: 'http://localhost:11434'
  }),
  tools: tools,
  instructions: 'You are a helpful assistant with access to various tools.'
});

// Execute the agent
const result = await agent.execute({
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'Can you help me with this task?' }]
    }
  ]
});
```

## Key MCPClient methods

- `getAllTools()`: Get all tools from all servers as a flat array (automatically connects to servers)
- `getAllToolsByServer()`: Get tools organized by server (automatically connects to servers)
- `getTools(serverName)`: Get tools from a specific server (automatically connects to that server)
- `getServerNames()`: Get list of configured server names

## Running the example

```bash
npm run start
```

This will execute the basic example and show the agent response along with available tools.

## Adding your own MCP servers

Modify the `mcpServers` configuration to add your own MCP-compatible servers:

```typescript
const mcpClient = new MCPClient({
  name: 'my-client',
  mcpServers: {
    'my-server': {
      url: 'https://my-mcp-server.example.com/mcp'
    },
    'local-server': {
      command: 'path/to/my-mcp-server',
      args: ['--port', '8080'],
      env: { 'API_KEY': 'my-key' }
    }
  }
});
```

## Learn More

- [MCP Specification](https://github.com/modelcontextprotocol/mcp-spec)
- [Agenite Documentation](https://agenite.xyz)
