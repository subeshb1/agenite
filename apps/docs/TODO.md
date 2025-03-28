# Agenite Documentation TODO

## Process Guidelines
- [ ] Always reference actual codebase - no hallucination
- [ ] Check existing code before documenting features
- [ ] Update TODO after each task completion
- [ ] Add requirements before starting each task
- [ ] Cross-reference with implementation
- [ ] Use mintlify native components. Example, CodeBlocks, CodeGroups, Tabs,Icons, Mermaid Diagrams, Cards, Callouts, Accordian, AccordianGroups, etc.

## Documentation Structure
- [ ] Review and analyze current codebase structure
- [ ] Map out actual implemented features
- [ ] Create documentation outline based on implemented features
- [ ] Get approval on documentation structure

## Current Documentation Status
- [x] Created initial API documentation files
  - [x] agent.mdx
  - [x] tool.mdx
  - [x] providers.mdx
  - [x] middleware.mdx
  - [x] steps.mdx
  - [x] llm.mdx

## Next Steps

### 1. Getting Started Section
- [ ] Introduction
  - [ ] Requirements:
    - [ ] Verify what Agenite actually is from codebase
    - [ ] List only implemented key features
    - [ ] Explain actual use cases
  - [ ] Tasks:
    - [ ] Update introduction.mdx
    - [ ] Add verified features
    - [ ] Add real examples
    - [ ] Talk about main feature (DON"T include any fluff)
    - [ ] Talk about architecure use of javacript generator and bidrectonal flow

- [ ] Quick Start
  - [ ] Requirements:
    - [ ] Test actual installation process
    - [ ] Create simple working example
    - [ ] Verify all required dependencies
  - [ ] Tasks:
    - [ ] Write installation guide
    - [ ] Show different provider using code gprips. Make the example a lot simpler please.
    - [ ] Create basic agent example
    - [ ] Use pretty logger for demo
    - [ ] Document basic tool usage

- [ ] Integrate tools into agent
  - [ ] Requirements:
    - [ ] Create simple agent
    - [ ] Use pretty logger for demo
    - [ ] Document basic tool usage
  - [ ] Tasks:
    - [ ] Write installation guide
    - [ ] Show basic tool integration
    - [ ] Show how MCP integration

### 2. Building Agents Section
- [ ] Agent Overview
  - [ ] Requirements:
    - [ ] Review agent implementation in codebase
    - [ ] Identify core agent features
    - [ ] List actual configuration options
  - [ ] Tasks:
    - [ ] Start with agent philosohy
    - [ ] Agent is build with steps
    - [ ] Show the default steps flow
    - [ ] you can pass middlewares to intercept
    - [ ] State mangement is done with reducers input / output structure
    - [ ] Only cover high level and point each to related section

- [ ] Agent Components
  - [ ] Requirements:
    - [ ] Review actual implementation of:
      - [ ] Steps
      - [ ] Middleware
      - [ ] State/Reducers
  - [ ] Tasks:
    - [ ] Document each component
    - [ ] Show how they integrate with agents
    - [ ] Provide real examples

### 3. Tools Section
- [ ] Requirements:
  - [ ] Review tool implementation
  - [ ] List supported tool types
  - [ ] Check schema validation features
- [ ] Tasks:
  - [ ] Document tool creation
  - [ ] Explain schema system
  - [ ] Show real tool examples

### 4. Providers Section
- [ ] Requirements:
  - [ ] List actually implemented providers
  - [ ] Check provider-specific features
  - [ ] Verify provider interfaces
- [ ] Tasks:
  - [ ] Document each provider
  - [ ] Show provider configuration
  - [ ] Add usage examples

### 5. Examples Section
- [ ] Requirements:
  - [ ] Review existing examples in codebase
  - [ ] Test each example
  - [ ] Identify missing examples
- [ ] Tasks:
  - [ ] Document basic examples
  - [ ] Create advanced examples
  - [ ] Add real-world use cases

### 6. API Reference
- [ ] Requirements:
  - [ ] Extract actual TypeScript interfaces
  - [ ] Verify implemented methods
  - [ ] Check return types and parameters
- [ ] Tasks:
  - [ ] Update API documentation
  - [ ] Add method descriptions
  - [ ] Include type information

## Questions to Resolve
1. What agent components are actually implemented?
2. Which providers are fully supported?
3. What are the current limitations?
4. What features are planned vs available?

## Notes
- Document actual implementation first
- Add planned features separately
- Keep track of assumptions vs verified features
- Note any discrepancies between docs and code 
