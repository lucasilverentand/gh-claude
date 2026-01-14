---
title: Auditing
slug: anatomy/audit
description: Track agent execution and handle failures
sidebar:
  label: Auditing
  order: 4
---

Every agent execution generates an audit trail, tracking metrics and optionally creating issues when failures occur.

## How Auditing Works

After every agent execution, the audit job:

1. Collects execution metrics (cost, duration, turns)
2. Gathers validation status from pre-flight checks
3. Records output execution results
4. On failure, runs a diagnostic agent to analyze what went wrong
5. Optionally creates a GitHub issue with the failure report

Auditing is always enabled; the configuration controls failure reporting behavior.

## Available Options

| Option | Description |
|--------|-------------|
| [create_issues](/repo-agents/audit/create-issues/) | Whether to create GitHub issues on failures (default: true) |
| [labels](/repo-agents/audit/labels/) | Labels to add to audit issues |
| [assignees](/repo-agents/audit/assignees/) | Users to assign to audit issues |

## Basic Syntax

Auditing is configured in the `audit` field of your agent's frontmatter:

```yaml
---
name: My Agent
on:
  issues:
    types: [opened]
audit:
  create_issues: true
  labels: [agent-failure]
---
```

## Full Configuration

An agent can specify all audit options:

```yaml
audit:
  create_issues: true
  labels:
    - agent-failure
    - needs-attention
  assignees:
    - maintainer
    - oncall
```

This configuration:
- Creates an issue when the agent fails
- Adds `agent-failure` and `needs-attention` labels
- Assigns the issue to `maintainer` and `oncall`
