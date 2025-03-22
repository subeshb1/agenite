import { BaseMessage } from '../types';

export interface AgentUseBlock {
  type: 'agentUse';
  name: string;
  input: string | BaseMessage[];
  [key: string]: unknown;
}

export const agentUseMessage = (
  agentName: string,
  input: string | BaseMessage[]
): BaseMessage => {
  return {
    role: 'user',
    content: [
      {
        type: 'agentUse',
        name: agentName,
        input,
      },
    ],
  };
}; 
