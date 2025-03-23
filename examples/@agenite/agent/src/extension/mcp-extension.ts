import {
  Agent,
  AgentConfig,
  BaseReturnValues,
  BaseNextValue,
  Step,
} from '@agenite/agent';

import {
  AnyStateReducer,
  BaseSteps,
  BaseMiddlewares,
  defaultStateReducer,
  defaultStepConfig,
  StateFromReducer,
} from '@agenite/agent';
import { BedrockProvider } from '@agenite/bedrock';
import {
  LLMProvider,
  ToolDefinition,
  ToolSchema,
  userTextMessage,
} from '@agenite/llm';
import { prettyLogger } from '@agenite/pretty-logger';
import { JSONSchema, Tool } from '@agenite/tool';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const createMCPTool = (tool: ToolDefinition, mcpServer: Client) => {
  return new Tool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as JSONSchema,
    execute: async ({ input }) => {
      const result = await mcpServer.callTool({
        name: tool.name,
        arguments: input as { [x: string]: unknown } | undefined,
      });

      return {
        isError: !!result.isError,
        data: result.content as unknown as string,
      };
    },
  });
};

const bedrockProvider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

export interface MCPServers {
  [key: string]: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
}

const mcpServerSetupStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  {
    type: 'agenite.mcp-server-setup';
    content: MCPServers | undefined;
  },
  null,
  BaseNextValue | undefined
> = {
  name: 'agenite.mcp-server-setup',
  beforeExecute: async () => {
    return null;
  },
  execute: async function* (_params, context) {
    const mcpServers = context.agent.agentConfig.extensions?.mcpServers as
      | MCPServers
      | undefined;

    const tools = await Promise.all(
      Object.entries(mcpServers ?? {}).map(async ([key, value]) => {
        const client = new Client({
          name: key,
          version: '1.0.0',
        });

        const transport = new StdioClientTransport({
          command: value.command,
          args: value.args,
          env: value.env,
        });

        client.connect(transport);

        const toolList = await client.listTools();

        return { toolList, mcpServer: client };
      })
    );
    console.log(JSON.stringify(tools, null, 2));
    context.agent.agentConfig.tools = [
      ...(context.agent.agentConfig.tools ?? []),
      ...(tools.flatMap((tool) => {
        return tool.toolList.tools.map((toolSchema) =>
          createMCPTool(
            {
              name: toolSchema.name,
              description: toolSchema.description ?? '',
              inputSchema: toolSchema.inputSchema as ToolSchema,
            },
            tool.mcpServer
          )
        );
      }) ?? []),
    ];

    yield {
      type: 'agenite.mcp-server-setup',
      content: tools as any,
    };

    return {
      next: 'agenite.llm-call',
      state: {},
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};

// 1. Factory Approach
export function createAgent<
  Reducer extends AnyStateReducer = typeof defaultStateReducer,
  Steps extends BaseSteps = typeof defaultStepConfig,
  Middlewares extends BaseMiddlewares = [],
>(
  provider: LLMProvider,
  options: {
    name: string;
    tools?: Tool[];
    instructions?: string;
    description?: string;
    stateReducer?: Reducer;
    initialState?: Partial<StateFromReducer<Reducer>>;
    steps?: Steps;
    middlewares?: Middlewares;
    // Extended features
    maxRetries?: number;
    timeout?: number;
    debug?: boolean;
    mcpServers?: MCPServers;
  }
) {
  const steps = {
    ...defaultStepConfig,
    ...options.steps,
    'agenite.mcp-server-setup': mcpServerSetupStep,
  };

  const config: AgentConfig<
    Reducer,
    typeof steps,
    Middlewares,
    {
      mcpServers?: MCPServers;
    }
  > = {
    name: options.name,
    provider,
    tools: options.tools,
    instructions: options.instructions,
    description: options.description,
    stateReducer: options.stateReducer,
    initialState: options.initialState,
    steps,
    middlewares: options.middlewares,
    startStep: 'agenite.mcp-server-setup',
    extensions: {
      mcpServers: options.mcpServers,
    },
  };

  return new Agent(config);
}

const agent = createAgent(bedrockProvider, {
  name: 'test',
  description: 'test',
  tools: [],
  middlewares: [prettyLogger()],
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        '/Users/username/Desktop',
        '/path/to/other/allowed/dir',
      ],
    },
  },
});

const iterator = agent.iterate({
  messages: [userTextMessage('show me 1 findings?')],
});

for await (const result of iterator) {
  switch (result.type) {
    case 'agenite.mcp-server-setup':
      // console.log(JSON.stringify(result.content, null, 2));
      break;
    default:
      break;
  }
}
