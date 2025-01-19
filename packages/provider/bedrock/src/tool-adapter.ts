import { Tool } from '@aws-sdk/client-bedrock-runtime';
import { ToolDefinition } from '@agenite/llm';

export class BedrockToolAdapter {
  convertToProviderTool(tool: ToolDefinition): Tool {
    return {
      toolSpec: {
        name: tool.name,
        description: tool.description || tool.name,
        inputSchema: {
          json: {
            type: 'object',
            properties: tool.parameters.properties,
            required: tool.parameters.required,
          },
        },
      },
    } as Tool;
  }
} 
