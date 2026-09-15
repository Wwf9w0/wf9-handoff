# Changelog

All notable changes to WF9 Handoff will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and the project intends to follow Semantic Versioning once public releases begin.

## [Unreleased]

### Added

- TypeScript CLI foundation (`wf9 --version`, `wf9 --help`)
- `wf9 init`: local `.handoff/` project initialization, safe to re-run
- `wf9 project setup` and `wf9 project show`: project identity stored in `.handoff/project.json`
- Commands resolve the project from any subdirectory by walking up to the nearest `.handoff/`
- `wf9 scan`: deterministic technology detection (language, runtime, package manager,
  framework, test framework) from `package.json`, `pom.xml`, `pubspec.yaml`, `Cargo.toml` and
  `go.mod`, stored under `technology` in `project.json`; `wf9 project setup` runs it too
- `wf9 repo`: captures the Git branch, HEAD, recent commits and staged, modified, deleted,
  renamed, untracked and conflicted files in `.handoff/repository.json`, read-only
- Initial project documentation
- Contributor and governance documentation
- GitHub issue and pull request templates

### Changed

- Technical documentation index moved to `docs/README.md`; the root `README.md` is now the
  project introduction
- `project.json` schema version 1.1 adds the optional `technology` field; 1.0 files are still
  read

### Fixed

- Nothing yet

### Security

- Nothing yet

## Release Format

Future releases should use sections such as:

```text
Added
Changed
Deprecated
Removed
Fixed
Security
```

Example:

```markdown
## [0.2.0] - 2027-01-10

### Added

- Project identity commands
- Deterministic technology scanner

### Fixed

- Windows path normalization during initialization
```
