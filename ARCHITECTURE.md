# Architecture

This document describes the intended architectural direction of WF9 Handoff.

The project is under active development, so implementation details may evolve.

## Goal

WF9 Handoff preserves durable software-project state across AI coding agents.

The architecture separates:

1. observable repository facts
2. recorded project knowledge
3. derived continuity artifacts
4. vendor-specific agent integrations

## High-Level Architecture

```text
                           CLI
                            │
                            ▼
                     Application Layer
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
 Project Identity      Repository State     Knowledge Store
                                                   │
                                 ┌─────────────────┼─────────────────┐
                                 │                 │                 │
                                 ▼                 ▼                 ▼
                            Decisions          Failures           Tasks
                                 │                 │                 │
                                 └────────────┬────┴───────┬─────────┘
                                              │            │
                                              ▼            ▼
                                        Verification   Working State
                                              │
                                              ▼
                                      Canonical Protocol
                                              │
                                  ┌───────────┴────────────┐
                                  ▼                        ▼
                              current.json             current.md
                                  │
                                  ▼
                             Adapter Layer
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                      Codex            Claude Code
```

## Architectural Boundaries

### CLI

Responsible for:

- command parsing
- user prompts
- terminal output
- exit codes

The CLI should not directly manipulate persistence formats.

### Core

Responsible for:

- domain models
- state transitions
- validation
- orchestration

The core should not know how Codex or Claude Code are launched.

### Git

Responsible for read-only repository inspection.

Examples:

- branch
- HEAD
- status
- recent commits
- changed paths

Git inspection must not mutate the repository.

### Scanner

Responsible for deterministic project detection.

Examples:

- TypeScript
- JavaScript
- Node.js
- Next.js
- Flutter
- Maven
- pnpm
- npm
- yarn

Unknown information should remain unknown.

### Storage

Responsible for local persistence under `.handoff/`.

Storage should provide stable APIs rather than exposing direct JSON manipulation throughout the application.

### Adapters

Responsible for vendor-specific behavior.

Examples:

- Codex CLI discovery
- Claude Code CLI discovery
- launch arguments
- continuation-context preparation

No adapter-specific behavior should leak into the canonical protocol unless it represents genuinely vendor-independent project state.

## Data Categories

### Observed

Deterministically discovered facts.

Examples:

- Git branch
- HEAD commit
- package manager
- modified files
- test execution result

### Recorded

Explicitly provided information.

Examples:

- decision
- decision reason
- failed approach
- active task
- current focus

### Derived

Generated from observed and recorded data.

Examples:

- `current.md`
- freshness state
- project health
- continuation instructions

These categories should remain distinguishable.

## Canonical State

The canonical state is intended to be machine-readable and versioned.

Planned file:

```text
.handoff/current.json
```

Human-readable output such as `current.md` must be derived from canonical state.

## Versioning

The CLI version and project-state schema version should remain conceptually separate.

Example:

```text
CLI: 0.5.0
Schema: 1.0
```

Breaking schema changes require explicit version changes.

## Safety

WF9 Handoff should be read-heavy and mutation-light.

It should never unexpectedly:

- modify source files
- stage Git changes
- commit
- push
- delete repository data
- alter global agent configuration

## Local-First

The core system should operate without:

- accounts
- cloud services
- remote databases
- AI APIs

Remote features may be added later as explicit opt-in capabilities.

## Agent Independence

The canonical project state should survive:

- changing models
- changing coding agents
- changing vendors
- changing editor integrations

This is one of the project's fundamental design constraints.
