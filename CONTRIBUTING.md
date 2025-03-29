# Contributing to Agenite

Thank you for your interest in contributing to Agenite! This document provides guidelines and instructions for contributing to this project.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Development environment setup](#development-environment-setup)
- [Development workflow](#development-workflow)
  - [Branching strategy](#branching-strategy)
  - [Making changes](#making-changes)
  - [Testing your changes](#testing-your-changes)
  - [Code style](#code-style)
- [Pull requests](#pull-requests)
  - [Creating a pull request](#creating-a-pull-request)
  - [Pull request checklist](#pull-request-checklist)
  - [Code review process](#code-review-process)
- [Using changesets](#using-changesets)
- [Documentation](#documentation)
- [Community](#community)
- [Helpful resources](#helpful-resources)

## Code of conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a respectful and inclusive community.

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (we use pnpm workspaces)
- TypeScript 5.x
- Git

### Development environment setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/agenite.git
   cd agenite
   ```
3. Add the original repository as a remote to keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/subeshb1/agenite.git
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Build all packages:
   ```bash
   pnpm build
   ```

## Development workflow

### Branching strategy

- `main` - The primary branch for stable releases
- Feature branches - For new features, bug fixes, or improvements

### Making changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Make your changes and ensure:
   - All tests pass: `pnpm test`
   - Linting passes: `pnpm lint`
   - Types check: `pnpm check-types`

4. Keep your branch up to date with the upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Testing your changes

Before submitting your changes, ensure they work as expected:

```bash
# Run all tests
pnpm test

# Check linting
pnpm lint

# Check types
pnpm check-types

# Build packages
pnpm build
```

### Code style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write clear comments and documentation
- Maintain test coverage

## Pull requests

### Creating a pull request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the original repository on GitHub and create a pull request from your fork.

3. Fill out the pull request template, providing a clear description of your changes.

### Pull request checklist

- [ ] Tests are added or updated for new functionality
- [ ] Documentation is updated
- [ ] All existing tests pass
- [ ] Code follows the project's style guidelines
- [ ] A changeset is included if needed (see [Using changesets](#using-changesets))

### Code review process

- Maintainers will review your pull request
- Address any requested changes from reviewers
- Once approved, a maintainer will merge your PR

## Using changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs. Here's how to use it:

1. After making your changes, create a changeset:
   ```bash
   pnpm changeset
   ```

2. Select the packages you've modified when prompted.

3. Choose the appropriate semver bump type (patch, minor, major).

4. Write a summary of changes when prompted.

5. Commit the changeset file:
   ```bash
   git add .changeset/*.md
   git commit -m "chore: add changeset for your feature"
   ```

When your PR is merged, our GitHub Actions will:
1. Collect all changesets
2. Update versions
3. Generate changelogs
4. Create a release PR
5. Publish to npm when the release PR is merged

## Documentation

Good documentation is crucial for the project:

- Update relevant README files
- Add JSDoc comments to public APIs
- Include examples for new features
- Update API documentation as needed

## Community

Join our community to get help or discuss ideas:

- [GitHub Discussions](https://github.com/subeshb1/agenite/discussions)
- [Discord Community](https://discord.gg/v3TXcD6tUH)

## Helpful resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Agenite Documentation](https://docs.agenite.com)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

Thank you for contributing to Agenite! Your efforts help make this project better for everyone. 
