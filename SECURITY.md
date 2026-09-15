# Security Policy

Security is important to WF9 Handoff because the project operates inside software repositories and may inspect project metadata, Git state, local files, and external coding-agent installations.

## Supported Versions

WF9 Handoff is currently in early development.

Until the first stable release, security fixes will generally target the latest development version.

| Version | Supported |
|---|---|
| Latest development release | Yes |
| Older pre-release versions | Best effort |
| Unreleased forks | No |

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for a security vulnerability that could expose users, repositories, credentials, or local systems.

Instead, report the issue privately through GitHub Security Advisories when available.

If private GitHub reporting is not yet enabled, use the security contact published on:

https://wf9labs.com

Please include:

- affected version or commit
- operating system
- reproduction steps
- potential impact
- proof of concept if safe to share
- suggested mitigation if known

Do not include third-party secrets or data you are not authorized to disclose.

## What Counts as a Security Issue?

Examples include:

- arbitrary command execution
- unsafe shell argument handling
- path traversal
- accidental reading of sensitive files
- secret or credential leakage
- unsafe temporary-file handling
- unauthorized modification of repositories
- malicious agent-adapter behavior
- unsafe parsing of project metadata
- insecure remote synchronization
- trust-boundary bypasses
- dependency vulnerabilities with practical impact

## Security Principles

WF9 Handoff should follow these principles:

### Local-first by default

Project continuity data should remain local unless the user explicitly enables remote functionality.

### Least data

Handoff should collect only the information required for project continuity.

### Never collect secrets intentionally

Automatic scanning must not capture the contents of:

```text
.env
.env.*
private keys
credential files
API tokens
authentication cookies
```

### Repository safety

Handoff must not unexpectedly:

- modify source files
- stage changes
- commit
- push
- delete user files
- rewrite Git history

### External process safety

Agent CLI integrations must:

- avoid unsafe shell interpolation
- escape arguments correctly
- prefer direct process execution over shell execution
- validate executable discovery
- avoid modifying global agent settings without explicit permission

### Clear trust boundaries

Observed repository state, recorded human/agent metadata, and derived Handoff output should remain distinguishable.

## Dependency Security

Dependencies should be added only when they provide clear value.

Maintainers should:

- review dependency ownership and maintenance
- avoid unnecessary transitive dependency growth
- update vulnerable packages when practical
- prefer built-in Node.js APIs for simple tasks

## Sensitive Data in Issues and Logs

Before sharing logs publicly, remove:

- access tokens
- API keys
- email addresses when sensitive
- private file paths when sensitive
- repository secrets
- proprietary source code
- internal URLs

## Disclosure Process

After a valid report:

1. The issue will be reproduced and assessed.
2. A fix will be prepared.
3. A release or patch will be published where appropriate.
4. Public disclosure will occur after users have a reasonable opportunity to update.

We appreciate responsible disclosure and good-faith security research.

Website: https://wf9labs.com
