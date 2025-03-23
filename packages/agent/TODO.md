## Agent

- [ ] Create proper interface for execute
  - [ ] Input: string | BaseMessage[]
  - [ ] Output
- [ ] Handle agent execution context
  - [ ] Nested execution
- [ ] Iterate
  - [ ] Handle yield values dynamically
- [ ] Observability & Tracing
  - [ ] Add tracing to agent
  - [ ] Injecting logger
  - [ ] Middle wares???
- [ ] Handle llm options
  - [ ] Streaming
  - [ ] Tool calling
  - [ ] Agentic loop
  - [ ] Observability

## Steps

- [ ] Typesafe steps
- [ ] Look into human in the middle step
- [X] Agent call step
- [ ] Support agents that don't have native tool calling.
- [ ] Handle custom steps start end flows, custom start / end

## States

- [ ] Better DX
- [ ] Make the state independent of `messages`

## Middlewares

- [ ] Root middleware
- [ ] Experiment step middlewares
- [ ] How to type safe. OMG

## Types

- [ ] Manage all utilities properly document

## Multi Agent Orchestration
- [ ] Support different type of multi agent orchestration
  - [ ] Supervisor tool
  - [ ] Supervisor agent with shared state
  - [ ] Multi agent with shared state handoff

## Pretty logger
  - [ ] Add more details to the logger

### LLM
  - [ ] Update token usage format and include pricing

## Priority
- [X] Support multi agent and tool orchestration
- [X] Create a logger cli middleware
- [X] Handle nested execution and build foundation for tracing / execution
- [X] Track tokens
- [ ] Docs


