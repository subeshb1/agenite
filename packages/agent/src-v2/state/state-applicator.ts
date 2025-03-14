import { StateFromReducer, StateReducer } from './state-reducer';

export const stateApplicator = <
  Reducer extends StateReducer<Record<string, any>>,
>(
  stateReducer: Reducer,
  previousState: Partial<StateFromReducer<Reducer>>,
  newState: Partial<StateFromReducer<Reducer>>
): StateFromReducer<Reducer> => {
  // Start with a copy of previous state to ensure required fields are preserved
  const updatedState: Partial<StateFromReducer<Reducer>> = {
    ...previousState,
    messages: previousState.messages || [], // Ensure messages is always present
  };

  (Object.keys(newState) as (keyof StateFromReducer<Reducer>)[]).forEach(
    (key) => {
      const reducer = stateReducer[key];
      // If there's a reducer for this key, use it
      if (reducer) {
        updatedState[key] =
          reducer(newState[key], previousState[key]) || previousState[key];
      } else if (key === 'messages') {
        if (newState[key]) {
          updatedState['messages'] = newState[key];
        }
      } else if (newState[key]) {
        updatedState[key] = newState[key];
      }
    }
  );

  return updatedState as StateFromReducer<Reducer>;
};
