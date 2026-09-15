# WF9 Handoff Roadmap

WF9 Handoff is being built incrementally.

The project focuses first on a reliable local project-state protocol, then on agent integrations.

## Completed

### Phase 0 — Project Foundation

- [x] TypeScript project structure
- [x] CLI foundation
- [x] build, test, lint, and formatting workflows

### Phase 1 — Project Initialization

- [x] `wf9 init`
- [x] `.handoff/` directory
- [x] local configuration
- [x] safe re-initialization behavior

### Phase 2 — Project Identity

- [x] `wf9 project setup`
- [x] `wf9 project show`
- [x] project name
- [x] project description
- [x] `project.json`
- [x] commands work from any subdirectory of the project

### Phase 3 — Deterministic Technology Scanner

- [x] `wf9 scan`, also run by `wf9 project setup`
- [x] language detection
- [x] runtime detection
- [x] framework detection
- [x] package-manager detection
- [x] test-framework detection
- [x] unknown-state handling
- [x] `package.json`, `pom.xml`, `pubspec.yaml`, `Cargo.toml`, `go.mod`
- [ ] projects with several ecosystems side by side (reported as unknown for now)

## Project State Foundation

### Phase 4 — Repository State

- [ ] current branch
- [ ] HEAD commit
- [ ] recent commits
- [ ] modified files
- [ ] staged files
- [ ] untracked files
- [ ] deleted and renamed files

### Phase 5 — Relevant Files Registry

- [ ] add important files
- [ ] describe file roles
- [ ] set importance
- [ ] list/remove entries

### Phase 6 — Decision Log

- [ ] add decisions
- [ ] list decisions
- [ ] active/superseded state
- [ ] related files

### Phase 7 — Rejected Approaches

- [ ] record failed or rejected approaches
- [ ] reasons
- [ ] related files

### Phase 8 — Verification Registry

- [ ] test verification
- [ ] build verification
- [ ] lint verification
- [ ] manual verification
- [ ] evidence and timestamps

### Phase 9 — Task State

- [ ] open
- [ ] in progress
- [ ] blocked
- [ ] done
- [ ] cancelled

### Phase 10 — Working State

- [ ] active task
- [ ] current focus
- [ ] last known good state
- [ ] next recommended action

### Phase 11 — Project Timeline

- [ ] append-only events
- [ ] JSONL event storage
- [ ] decisions/tasks/verifications in timeline

## Continuity Protocol

### Phase 12 — Canonical Project State

- [ ] versioned Zod schema
- [ ] `current.json`
- [ ] schema validation

### Phase 13 — Human-Readable State

- [ ] deterministic `current.md`
- [ ] clear project summary

### Phase 14 — Freshness

- [ ] fresh/stale/unknown
- [ ] Git drift detection
- [ ] changed-files count

### Phase 15 — Snapshots

- [ ] point-in-time handoff snapshots
- [ ] snapshot history

### Phase 16 — Continuation Contract

- [ ] `CONTINUE.md`
- [ ] agent-independent continuation rules

## Agent Integration

### Phase 17 — Adapter Architecture

- [ ] generic `AgentAdapter`
- [ ] adapter registry
- [ ] test adapter

### Phase 18 — Codex

- [ ] detect Codex
- [ ] prepare continuation context
- [ ] launch safely

### Phase 19 — Claude Code

- [ ] detect Claude Code
- [ ] prepare continuation context
- [ ] launch safely

### Phase 20 — Seamless Switching

- [ ] `wf9 switch codex`
- [ ] `wf9 switch claude`
- [ ] automatic state refresh before launch

## Extended Capabilities

### Agent Attribution

- [ ] human vs agent-created metadata
- [ ] agent contribution history

### Agent Sessions

- [ ] lightweight session metadata
- [ ] tasks completed
- [ ] decisions created
- [ ] no full chat transcript dependency

### Agent-Native Updates

- [ ] agents can update Handoff through supported commands

### MCP

- [ ] read project state
- [ ] manage decisions
- [ ] manage tasks
- [ ] record failures
- [ ] update working state

### Repository Drift

- [ ] detect state contradicting recorded decisions

### Conflict Detection

- [ ] structural project-state conflicts

### Project Health

- [ ] `wf9 doctor`
- [ ] continuity health report

## Future

- [ ] desktop UI
- [ ] team mode
- [ ] optional cloud synchronization
- [ ] additional coding-agent adapters

## Product Boundary

WF9 Handoff is not intended to become:

- an IDE
- a Git replacement
- a generic task manager
- an AI model
- a full conversation exporter
- a cloud-only development platform

The core goal remains:

> Keep durable project state independent from whichever coding agent is currently active.

Website: https://wf9labs.com
