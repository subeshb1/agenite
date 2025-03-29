# Agenite Documentation TODO

## Process Guidelines
- [x] Always reference actual codebase - no hallucination
- [x] Check existing code before documenting features
- [x] Update TODO after each task completion
- [x] Add requirements before starting each task
- [x] Cross-reference with implementation
- [x] Use mintlify native components. Example, CodeBlocks, CodeGroups, Tabs,Icons, Mermaid Diagrams, Cards, Callouts, Accordian, AccordianGroups, etc.

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
- [x] Introduction
  - [x] Requirements:
    - [x] Verify what Agenite actually is from codebase
    - [x] List only implemented key features
    - [x] Explain actual use cases
  - [x] Tasks:
    - [x] Update introduction.mdx
    - [x] Add verified features
    - [x] Add real examples
    - [x] Talk about main feature (DON"T include any fluff)
    - [x] Talk about architecure use of javacript generator and bidrectonal flow

- [x] Quick Start
  - [x] Requirements:
    - [x] Test actual installation process
    - [x] Create simple working example
    - [x] Verify all required dependencies
  - [x] Tasks:
    - [x] Write installation guide
    - [x] Show different provider using code groups
    - [x] Create basic agent example
    - [x] Use pretty logger for demo
    - [x] Document basic tool usage

- [x] Integrate tools into agent
  - [x] Requirements:
    - [x] Create simple agent
    - [x] Use pretty logger for demo
    - [x] Document basic tool usage
    - [x] Show how MCP integration works
  - [x] Tasks:
    - [x] Write installation guide
    - [x] Show basic tool integration
    - [x] Show how MCP integration

## Building the Core concepts section
- [ ] Requirements:
  - [ ] Find out core concepts implemented in codebase
    - [x] Agents
    - [ ] Tools
    - [ ] Providers
  - [] We're gonna keep the details not too deep but enough as we are going to talk about them in other sections
  - [x] Create outline for core concepts
  - [ ] Get approval on outline
  - [ ] Tasks:
    - [ ] Write core concepts section
    - [ ] Thinkgs to higligh
      - [x] User of generators 
      - [x] Bidirectional flow
      - [x] Agent
      - [ ] Tool
      - [ ] Providers
      - [ ] LLM

### 1. Building Agents Section
- [x] Agent Overview
  - [x] Requirements:
    - [x] Review agent implementation in codebase
    - [x] Identify core agent features
    - [x] List actual configuration options
  - [x] Tasks:
    - [x] Start with agent philosophy
    - [x] Agent is built with steps
    - [x] Show the default steps flow
    - [x] Show how to pass middlewares to intercept
    - [x] Show state management with reducers input/output structure
    - [x] Only cover high level and point each to related section

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

### 2. Tools Section
- [ ] Requirements:
  - [ ] Review tool implementation
  - [ ] List supported tool types
  - [ ] Check schema validation features
- [ ] Tasks:
  - [ ] Document tool creation
  - [ ] Explain schema system
  - [ ] Show real tool examples

### 3. Providers Section
- [ ] Requirements:
  - [ ] List actually implemented providers
  - [ ] Check provider-specific features
  - [ ] Verify provider interfaces
- [ ] Tasks:
  - [ ] Document each provider
  - [ ] Show provider configuration
  - [ ] Add usage examples

## Examples Section
- [ ] Requirements:
  - [ ] Review existing examples in codebase
  - [ ] Test each example
  - [ ] Identify missing examples
- [ ] Tasks:
  - [ ] Document basic examples
  - [ ] Create advanced examples
  - [ ] Add real-world use cases

##  API Reference
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
