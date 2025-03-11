# Bedrock Example

This example demonstrates how to use Amazon Bedrock with Agenite to create AI agents that can process user inputs and generate responses using different models (Deepseek and Claude).

## Prerequisites

1. AWS Account with access to Amazon Bedrock
2. AWS credentials configured locally with appropriate permissions
3. Node.js installed on your system

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure AWS Credentials:
Make sure you have your AWS credentials configured either through:
- AWS CLI (`aws configure`)
- Environment variables
- AWS credentials file

## Running the Examples

The examples include simple demonstrations using different Bedrock models to answer questions.

### Deepseek Example
```bash
tsx src/deepseek-r1/agent.ts
```

### Claude Sonnet Example
```bash
tsx src/claude-sonnet-3.7/agent.ts
```

Both examples will:
1. Initialize an AI agent using the Bedrock provider
2. Process a sample question about counting letters in "strawberry"
3. Display the agent's reasoning and answer
4. Show any tool results used during the process

## Configuration

### Deepseek Configuration
- Model: `us.deepseek.r1-v1:0`
- Region: `us-west-2`
- File: `src/deepseek-r1/agent.ts`

### Claude Sonnet Configuration
- Model: `us.anthropic.claude-3-7-sonnet-20250219-v1:0`
- Region: `us-east-2`
- Additional settings:
  - `enableReasoning: true`
  - `reasoningBudgetTokens: 4000`
- File: `src/claude-sonnet-3.7/agent.ts`

You can modify these settings in their respective files if needed.

## Output Format

Both examples will display:
1. User Input (in blue)
2. Thinking/Reasoning Process (in yellow)
3. Assistant's Response (in green)
4. Tool Usage (in cyan, if any)
5. Tool Results (in blue, if any)
6. Completion message

## Note

Make sure you have the necessary AWS permissions to access Amazon Bedrock and the specific models being used in the examples. Different models may require different permissions in your AWS Bedrock setup. 
