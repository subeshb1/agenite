import { BaseMessage } from '@agenite/llm';

import { StateReducer } from '@agenite/agent';

export const customStateReducer: StateReducer<{
  /** Magic number */
  a?: number;
}> = {
  messages: (newValue?: BaseMessage[], previousValue?: BaseMessage[]) => {
    if (!newValue) {
      return previousValue || [];
    }
    return [...(previousValue || []), ...newValue];
  },
  a: (newValue?: number, _previousValue?: number) => {
    return (newValue || 0) + 1000;
  },
};
