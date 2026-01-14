---
title: Outputs
slug: anatomy/outputs
description: Actions your agent can perform
sidebar:
  label: Outputs
  order: 3
---

Outputs define what actions your agent is authorized to perform, acting as a permission boundary for agent capabilities.

## How Outputs Work

When you define outputs in your agent's frontmatter, the compiler:

1. Generates skill documentation for Claude explaining each operation
2. Configures the appropriate GitHub MCP tools
3. Sets up validation to ensure outputs match their schemas
4. Creates execution jobs to perform the authorized actions

Without outputs defined, your agent operates in read-only mode.

## Available Output Types

| Output | Description |
|--------|-------------|
| [add-comment](/repo-agents/outputs/add-comment/) | Add comments to issues or PRs |
| [add-label](/repo-agents/outputs/add-label/) | Add labels to issues or PRs |
| [remove-label](/repo-agents/outputs/remove-label/) | Remove labels from issues or PRs |
| [create-issue](/repo-agents/outputs/create-issue/) | Create new issues |
| [create-discussion](/repo-agents/outputs/create-discussion/) | Create new discussions |
| [create-pr](/repo-agents/outputs/create-pr/) | Create pull requests with code changes |
| [update-file](/repo-agents/outputs/update-file/) | Modify repository files |
| [close-issue](/repo-agents/outputs/close-issue/) | Close issues |
| [close-pr](/repo-agents/outputs/close-pr/) | Close pull requests |

## Basic Syntax

Outputs are defined in the `outputs` field of your agent's frontmatter:

```yaml
---
name: Triage Bot
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---
```

## Multiple Outputs

An agent can have multiple outputs with constraints:

```yaml
outputs:
  add-comment:
    max: 3
  add-label: true
  create-issue:
    max: 1
  close-issue: true
```

This agent can:
- Add up to 3 comments per run
- Add labels without limit
- Create at most 1 new issue
- Close issues without limit
