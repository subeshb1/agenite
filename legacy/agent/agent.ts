import { Agent, AgentContext, AgentConfig, BaseMessage } from './types';
import { createAgentLogger } from './agent-logger';
import { iterate } from './execution/iterate';
import { execute } from './execution/execute';
import { createEmptyLogger } from '../../logger/empty-logger';
import { PrettyPrintOptions } from './pretty-printer';
import { createClaudeProvider } from '../provider';

function normalizeMessages(messages: string | BaseMessage[]): BaseMessage[] {
  if (typeof messages === 'string') {
    return [
      {
        role: 'user',
        content: [{ type: 'text', text: messages }],
      },
    ];
  }
  return messages;
}

export function createAgent({
  name,
  provider = createClaudeProvider({}),
  systemPrompt,
  description = '',
  tools = [],
  logger = createEmptyLogger(),
  stopCondition = 'terminal',
}: AgentConfig): Agent {
  const agentLogger = createAgentLogger(logger, name);

  return {
    name,
    provider,
    systemPrompt,
    description,
    tools,
    executableType: 'agent',
    stopCondition,

    iterate({
      messages,
      context,
      stream,
    }: {
      messages: string | BaseMessage[];
      context?: AgentContext;
      stream?: boolean;
    }) {
      const normalizedMessages = normalizeMessages(messages);
      return iterate({
        messages: normalizedMessages,
        context,
        provider,
        systemPrompt,
        logger: agentLogger,
        agentName: name,
        tools,
        stream,
        stopCondition,
      });
    },

    execute({
      messages,
      context,
      stream,
      prettyPrint,
    }: {
      messages: string | BaseMessage[];
      context?: AgentContext;
      stream?: boolean;
      prettyPrint?: PrettyPrintOptions;
    }) {
      const normalizedMessages = normalizeMessages(messages);
      return execute({
        messages: normalizedMessages,
        context,
        provider,
        systemPrompt,
        logger: agentLogger,
        agentName: name,
        tools,
        stream,
        prettyPrint,
        stopCondition,
      });
    },
  };
}
