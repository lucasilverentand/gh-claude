---
title: Context
slug: anatomy/context
description: Collect repository data before agent execution
sidebar:
  label: Context
  order: 2
---

Context collection enables agents to gather repository data before execution, useful for scheduled agents that analyze trends or process batches.

## How Context Works

When you define context in your agent's frontmatter, the compiler:

1. Generates a context collection job that runs before the agent
2. Queries the GitHub API for the specified data types
3. Filters results by time range and other criteria
4. Skips agent execution if `min_items` threshold isn't met

The collected data is provided to Claude as structured markdown sections.

## Available Context Types

| Context | Description |
|---------|-------------|
| [Issues](/repo-agents/context/issues/) | Repository issues with state, label, and assignee filters |
| [Pull Requests](/repo-agents/context/pull-requests/) | Pull requests with state, label, and reviewer filters |
| [Discussions](/repo-agents/context/discussions/) | Discussions with category and answered state filters |
| [Commits](/repo-agents/context/commits/) | Recent commits with branch and author filters |
| [Releases](/repo-agents/context/releases/) | Repository releases including prereleases and drafts |
| [Workflow Runs](/repo-agents/context/workflow-runs/) | GitHub Actions workflow run results |

## Basic Syntax

Context is defined in the `context` field of your agent's frontmatter:

```yaml
---
name: Weekly Digest
on:
  schedule:
    - cron: '0 9 * * 1'
context:
  issues:
    states: [open]
  since: '7d'
---
```

## Multiple Context Types

An agent can collect multiple data types at once:

```yaml
context:
  issues:
    states: [open]
  pull_requests:
    states: [open, merged]
  commits:
    branches: [main]
  since: '7d'
  min_items: 3
```

This agent collects:
- Open issues from the last 7 days
- Open and merged PRs from the last 7 days
- Commits on main from the last 7 days
- Only runs if the combined total is at least 3 items
