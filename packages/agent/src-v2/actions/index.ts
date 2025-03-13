import { BaseMessage } from '@agenite/llm';
import { Action, ActionContext } from '../types/action';

import { DefaultActionType } from '../types/action';
import { AgentAction } from './agent-call';
import { LLMAction } from './llm-call';
import { ToolAction } from './tool-call';
import { ToolResultAction } from './tool-result';

export interface BaseReturnValues {
  next: DefaultActionType;
  state: {
    messages: BaseMessage[];
  };
}

export const defaultActionConfig: {
  [key in DefaultActionType | (string & {})]?: Action<any, any, any, any>;
} = {
  'agenite.llm-call': LLMAction,
  'agenite.tool-call': ToolAction,
  'agenite.agent-call': AgentAction,
  'agenite.tool-result': ToolResultAction,
};

export const runAction = async function* (
  task: Action<BaseReturnValues, any, unknown, unknown>,
  executionContext: ActionContext<any>
) {
  const beforeResult = await task.beforeExecute(executionContext);
  const result = yield* task.execute(beforeResult);
  const afterResult = await task.afterExecute(result);
  return afterResult;
};
