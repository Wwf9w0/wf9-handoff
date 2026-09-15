# Governance

WF9 Handoff is currently maintained by **WF9 Labs**.

This document describes the project's initial governance model. It may evolve as the contributor community grows.

## Principles

Project governance should favor:

- technical merit
- transparent decisions
- small and reviewable changes
- protocol stability
- security
- backwards compatibility when practical
- vendor independence

## Maintainers

Maintainers are responsible for:

- reviewing pull requests
- triaging issues
- managing releases
- maintaining security practices
- protecting architectural boundaries
- evolving the project-state protocol
- approving breaking changes

## Decision Making

Small implementation decisions may be made through normal pull-request review.

Larger changes should be discussed publicly before implementation.

Examples:

- breaking CLI changes
- protocol-version changes
- persistence-model changes
- new remote/cloud behavior
- security-model changes
- agent-adapter contract changes
- changes that introduce AI dependencies into the core

Maintainers make the final decision when consensus cannot be reached.

## Protocol Changes

The canonical project-state protocol is a critical part of WF9 Handoff.

Breaking protocol changes should:

1. have a documented rationale
2. include migration implications
3. increment the schema version
4. update tests and documentation
5. avoid unnecessary vendor-specific fields

## Becoming a Maintainer

Long-term contributors may be invited to become maintainers based on:

- sustained high-quality contributions
- constructive reviews
- strong understanding of project architecture
- reliability
- security awareness
- respectful community participation

Maintainer status is based on demonstrated contribution, not employment or affiliation alone.

## Conflicts of Interest

Maintainers should disclose relevant conflicts when decisions materially affect organizations, products, or commercial interests with which they are associated.

## Commercial Use

WF9 Handoff may be used commercially under the repository license.

Commercial activity should not override the integrity of the open-source core or governance process.

## Changes to Governance

Governance changes should be proposed through a public issue or pull request.

Website: https://wf9labs.com
