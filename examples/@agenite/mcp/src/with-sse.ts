import { Agent } from '@agenite/agent';
import { OllamaProvider } from '@agenite/ollama';
import { MCPClient } from '@agenite/mcp';
import { prettyLogger } from '@agenite/pretty-logger';
async function main() {
  // Initialize MCP client
  const mcpClient = new MCPClient({
    name: 'mcp-example',
    mcpServers: {
      '@modelcontextprotocol/fetch': {
        url: 'https://router.mcp.so/sse/rrrcnqm8s6mf5l',
      },
    },
  });

  try {
    // Get all tools from all servers as a flat array
    // This automatically connects to the servers
    console.log('Fetching tools from all MCP servers...');
    const tools = await mcpClient.getAllTools();

    console.log(`Found ${tools.length} tools across all servers`);

    // Create an agent with the MCP tools
    const agent = new Agent({
      name: 'mcp-enabled-agent',
      provider: new OllamaProvider({
        model: 'llama3.2',
        baseURL: 'http://localhost:11434',
      }),
      tools: tools,
      instructions:
        'You are a helpful assistant with access to various external tools. Use them when appropriate to answer user questions.',
      middlewares: [prettyLogger()],
    });

    // Example execution
    const result = await agent.execute({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is https://docs.agenite.com/ about?' },
          ],
        },
      ],
    });

    // Print the result
    if (result.messages.length > 0) {
      const lastMessage = result.messages[result.messages.length - 1];
      if (lastMessage) {
        console.log('Agent response:', lastMessage.content);
      }
    }

    // Alternative: Get tools by server
    console.log('\nTools available by server:');
    const toolsByServer = await mcpClient.getAllToolsByServer();

    for (const [serverName, serverTools] of Object.entries(toolsByServer)) {
      console.log(`${serverName}: ${serverTools.length} tools available`);
      serverTools.forEach((tool) => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
    }
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
