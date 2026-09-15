# WF9 Handoff

> Switch AI agents without restarting the work.

WF9 Handoff is an open-source, local-first project continuity layer for AI coding agents. It
keeps durable project state (project identity, repository state, decisions, rejected approaches,
verification results and active work) in a `.handoff/` directory inside your repository, so that
whichever agent picks up the project next (e.g. Codex after Claude Code) sees the same project
reality.

Everything runs locally. No backend, database, AI API, account or cloud.

> **Status:** Phase 4. `init`, project identity, technology detection and repository state work;
> no decisions, tasks or agent adapters yet. See the [roadmap](ROADMAP.md).

## Usage

The command is `wf9`. Run `init` in the root of the project you want to hand off:

```sh
cd ~/my-project
wf9 init             # creates .handoff/config.json (safe to re-run)
wf9 project setup    # asks for the project name and what it is for, detects the technology
wf9 project show     # prints .handoff/project.json
wf9 scan             # detects the technology again after the stack changed
wf9 repo             # captures the Git state in .handoff/repository.json
```

Like Git, every other command works from anywhere inside the project: it walks up from the
current directory to the nearest `.handoff/`. Running `init` inside an already initialized
project does not create a nested `.handoff/`; it points to the existing one instead.

`project setup` prompts only in an interactive terminal. Agents and scripts pass the values as
options instead; any option left out keeps its saved value:

```sh
wf9 project setup --name my-project --description "Cross-agent project continuity tool"
wf9 project setup --description "A sharper one-sentence purpose"
```

### Technology detection

`project setup` and `scan` read well-known files in the project root and store what they
prove under `technology` in `.handoff/project.json`:

```json
{
  "technology": {
    "language": "typescript",
    "runtime": "node",
    "packageManager": "pnpm",
    "framework": null,
    "testFramework": "vitest"
  }
}
```

Nothing is guessed. `null` means the files show there is none (here: no framework);
`"unknown"` means the files do not settle it, for example two lockfiles from different package
managers. The scanner reads `package.json` (plus `tsconfig.json`, lockfiles and
`pnpm-workspace.yaml`), `pom.xml`, `pubspec.yaml`, `Cargo.toml` and `go.mod`. A project with
more than one of these side by side is reported as unknown for now.

### Repository state

`wf9 repo` asks Git for the current branch, HEAD, the ten most recent commits and every
uncommitted change (staged, modified, deleted, renamed, untracked and conflicted files), and
writes it to `.handoff/repository.json` with the time it was captured.

The repository is the source of truth. `repository.json` is only ever written from Git's own
output, and each run replaces the whole file, so if an agent's claim about the code contradicts
it, the repository wins. Inspecting is read-only: Git runs without a shell and with
`--no-optional-locks`, so not even the index is touched.

## Installation

WF9 Handoff is not published to npm yet. Build it from source:

```sh
git clone git@github.com:Wwf9w0/wf9-handoff.git
cd wf9-handoff
pnpm install
pnpm build
```

Then make `wf9` available in your other projects, either by linking it globally:

```sh
pnpm setup           # once: adds pnpm's global bin directory to PATH, then restart the shell
pnpm link --global   # run inside the wf9-handoff checkout
cd ~/my-project && wf9 init
```

or by calling the built file directly:

```sh
cd ~/my-project && node /path/to/wf9-handoff/dist/cli/index.js init
```

Both point at your checkout's `dist/`, so re-running `pnpm build` is enough to pick up changes.

### Requirements

- Node.js >= 22.12
- pnpm (`corepack enable pnpm`)

## Development

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm build`        | Compile `src/` to `dist/` with TypeScript |
| `pnpm typecheck`    | Type-check `src/` and `tests/`            |
| `pnpm test`         | Run the test suite once (Vitest)          |
| `pnpm test:watch`   | Run tests in watch mode                   |
| `pnpm lint`         | Lint with ESLint                          |
| `pnpm format`       | Format all files with Prettier            |
| `pnpm format:check` | Check formatting without writing          |
| `pnpm wf9 <cmd>`    | Run the built CLI                         |

> **Note:** `pnpm wf9 <command>` always runs in _this_ repository's root, because pnpm runs
> scripts from the package directory, not from where you typed the command. Use it only to try
> the CLI on this repository itself, never to set up another project.

```text
src/
  cli/       command-line entry point and commands
  core/      domain logic
  git/       Git history and diff analysis
  scanner/   project structure detection
  storage/   reading and writing .handoff/
  adapters/  output formats for specific agents (Codex, Claude Code, ...)
tests/
```

## Documentation

- [Technical documentation](docs/README.md)
- [Architecture](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Governance](GOVERNANCE.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

Website: https://wf9labs.com
