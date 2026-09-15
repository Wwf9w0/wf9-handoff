# Contributing to WF9 Handoff

Thank you for your interest in contributing to **WF9 Handoff**.

WF9 Handoff is an open-source, local-first project continuity layer for AI coding agents. The project aims to preserve repository state, technical decisions, rejected approaches, verification results, active work, and other durable project knowledge across agent switches.

We value contributions that keep the project:

- understandable
- deterministic
- local-first
- vendor-independent
- testable
- safe for user repositories
- focused on real project-continuity problems

## Before You Start

Please search existing issues and pull requests before opening a new one.

For small fixes, documentation improvements, tests, or clearly scoped bugs, feel free to open a pull request directly.

For larger changes such as:

- protocol changes
- new persistence models
- agent adapter architecture
- MCP support
- cloud synchronization
- new security-sensitive behavior
- breaking CLI changes

please open an issue or discussion first.

## Development Setup

Requirements:

- Node.js
- pnpm
- Git

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/wf9-handoff.git
cd wf9-handoff
```

Install dependencies:

```bash
pnpm install
```

Run the project checks:

```bash
pnpm test
pnpm lint
pnpm build
```

## Development Principles

### 1. Keep the core deterministic

Do not introduce AI calls where repository inspection, explicit metadata, or deterministic logic can solve the problem.

### 2. Keep agent-specific logic isolated

Codex, Claude Code, and future integrations belong behind adapter boundaries.

The core protocol must not depend on one vendor.

### 3. Prefer explicit knowledge over guesses

If Handoff cannot reliably determine a fact, use an unknown or absent value rather than inferring one.

### 4. Protect the user's repository

Handoff must not unexpectedly:

- edit source files
- stage Git changes
- create commits
- push branches
- delete files
- modify global agent configuration

Any mutating behavior must be explicit.

### 5. Preserve history

Architectural decisions and rejected approaches should generally be superseded or archived rather than silently overwritten.

### 6. Keep changes focused

Avoid unrelated refactoring inside a feature or bug-fix pull request.

### 7. Test state-integrity behavior

Features that affect project state, persistence, protocol validation, or repository inspection should include tests.

## Project Structure

The project is organized around clear boundaries:

```text
src/
├── cli/
├── core/
├── git/
├── scanner/
├── storage/
└── adapters/

tests/
```

General responsibility:

- `cli/`: command-line interaction and presentation
- `core/`: domain models and application logic
- `git/`: Git inspection
- `scanner/`: deterministic project detection
- `storage/`: local persistence
- `adapters/`: agent-specific integrations

Do not mix CLI presentation, persistence, Git execution, and domain logic unless there is a strong reason.

## Branches

Use a descriptive branch name, for example:

```text
feat/project-identity
fix/windows-path-handling
docs/security-policy
test/project-scanner-fixtures
```

## Commit Messages

Clear commit messages are preferred.

Examples:

```text
feat: add project identity setup
fix: preserve existing handoff config on init
test: add pnpm project scanner fixture
docs: document repository freshness model
```

Conventional Commits are encouraged but not strictly required unless the repository later adopts automated release tooling.

## Pull Requests

A good pull request includes:

- a clear title
- the problem being solved
- implementation summary
- tests
- compatibility notes
- screenshots or terminal output when relevant
- no unrelated changes

Before opening a pull request, run:

```bash
pnpm test
pnpm lint
pnpm build
```

## Testing

Tests should cover both successful behavior and failure cases.

Important areas include:

- filesystem safety
- existing-data preservation
- protocol validation
- malformed local state
- Git repository edge cases
- cross-platform paths
- missing external agent CLIs
- stale project state

Use fixture repositories where deterministic project-scanner or Git behavior needs realistic input.

## Documentation

Changes that affect public behavior should update documentation.

Examples:

- new CLI commands
- new project-state fields
- protocol changes
- new adapters
- breaking changes

The README should remain a high-level introduction. Detailed technical documentation belongs under `docs/`.

## Security-Sensitive Changes

If your contribution touches:

- command execution
- credentials
- filesystem traversal
- shell escaping
- external processes
- agent configuration
- remote synchronization

please explain the security implications in the pull request.

Do not include secrets, tokens, private repository data, or sensitive logs in tests or examples.

## Reporting Bugs

When possible, include:

- operating system
- Node.js version
- pnpm version
- Git version
- WF9 Handoff version or commit
- exact command
- expected behavior
- actual behavior
- minimal reproduction

Never include credentials or sensitive source code unless the reproduction is intentionally public.

## Feature Requests

The most useful feature requests describe a real continuity failure.

Please explain:

1. Which coding agents were involved?
2. What project state was lost?
3. What did the second agent have to rediscover?
4. What information would have allowed it to continue correctly?

## Code Review

Review should focus on:

- correctness
- simplicity
- maintainability
- test coverage
- compatibility
- safety
- architectural boundaries

Constructive disagreement is welcome.

## License

By contributing, you agree that your contributions will be licensed under the license used by this repository.

## Questions

For project questions, use GitHub Discussions if enabled, or open an issue when the question relates to a concrete bug, proposal, or workflow.

Website: https://wf9labs.com
