import { BaseMessage } from '@agenite/llm';
import { AgentMethods } from './types/agent';

const executionConfig = {
  llmCall: new LLMHandler(),
  toolCall: new ToolHandler(),
  agentCall: new AgentHandler(),
};

export class Agent implements AgentMethods {
  constructor(private readonly agent: Agent) {}

  async execute(input: string | BaseMessage[], options?: unknown) {
    while (true) {
      const nextExecutionType = extractNextExecutionType(this.agent.state);

      const nextExecution = executionConfig[nextExecutionType];

      const result = await nextExecution.execute(this.agent.state);
    }

    return this.agent.state
  }
}
    