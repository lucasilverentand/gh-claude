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

### Comments & Labels
| Output | Description |
|--------|-------------|
| [add-comment](/repo-agents/outputs/comments/) | Add comments to issues or PRs |
| [add-label](/repo-agents/outputs/labels/) | Add labels to issues or PRs |
| [remove-label](/repo-agents/outputs/labels/) | Remove labels from issues or PRs |
| [add-reaction](/repo-agents/outputs/reactions/) | Add emoji reactions to issues, PRs, or comments |

### Issues
| Output | Description |
|--------|-------------|
| [create-issue](/repo-agents/outputs/issues/) | Create new issues |
| [close-issue](/repo-agents/outputs/issues/) | Close issues |
| [reopen-issue](/repo-agents/outputs/issues/) | Reopen closed issues |
| [edit-issue](/repo-agents/outputs/issues/) | Edit issue title, body, or state |
| [assign-issue](/repo-agents/outputs/issues/) | Assign users to issues |
| [pin-issue](/repo-agents/outputs/issues/) | Pin issues to repository |
| [set-milestone](/repo-agents/outputs/issues/) | Set milestone on issues or PRs |
| [lock-conversation](/repo-agents/outputs/issues/) | Lock issue or PR conversations |
| [convert-to-discussion](/repo-agents/outputs/issues/) | Convert issues to discussions |

### Pull Requests
| Output | Description |
|--------|-------------|
| [create-pr](/repo-agents/outputs/pull-requests/) | Create pull requests with code changes |
| [close-pr](/repo-agents/outputs/pull-requests/) | Close pull requests |
| [merge-pr](/repo-agents/outputs/pull-requests/) | Merge pull requests |
| [approve-pr](/repo-agents/outputs/pull-requests/) | Approve pull requests |
| [request-review](/repo-agents/outputs/pull-requests/) | Request reviewers for PRs |

### Discussions
| Output | Description |
|--------|-------------|
| [create-discussion](/repo-agents/outputs/discussions/) | Create new discussions |

### Files & Branches
| Output | Description |
|--------|-------------|
| [update-file](/repo-agents/outputs/files/) | Modify repository files |
| [create-branch](/repo-agents/outputs/branches/) | Create new branches |
| [delete-branch](/repo-agents/outputs/branches/) | Delete branches |

### Releases & Workflows
| Output | Description |
|--------|-------------|
| [create-release](/repo-agents/outputs/releases/) | Create GitHub releases |
| [trigger-workflow](/repo-agents/outputs/workflows/) | Trigger workflow_dispatch events |

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
