# @agenite/mcp

A Model Context Protocol (MCP) implementation for Agenite.

## Installation

```bash
npm install @agenite/mcp
```

## Usage

### Creating a client

```typescript
import { MCPClient } from '@agenite/mcp';

// Create an MCPClient to connect to a filesystem MCP server
const client = new MCPClient({
  name: 'filesystem',
  version: '1.0.0', // optional, defaults to '1.0.0'
  serverConfig: {
    command: 'npx',
    args: [
      '-y',
      '@modelcontextprotocol/server-filesystem',
      '/path/to/allowed/dir',
      '/path/to/other/allowed/dir',
    ],
    // Optional environment variables
    env: {
      // NODE_ENV: 'production'
    }
  }
});

// Connect to the server (automatically called when needed)
client.connect();
```

### Getting available tools

```typescript
// Get all available tools from the MCP server
const tools = await client.getTools();

// Use these tools in your agent
const agent = createAgent({
  // ...
  tools: [
    ...tools,
    // other tools
  ]
});
```

### Calling a tool directly

```typescript
// Call a tool directly
const result = await client.callTool('listFiles', {
  directory: '/path/to/allowed/dir'
});

if (result.isError) {
  console.error('Error calling tool:', result.data);
} else {
  console.log('Tool result:', result.data);
}
```

### Disconnecting

```typescript
// Disconnect when done
client.disconnect();
```

## License

MIT
