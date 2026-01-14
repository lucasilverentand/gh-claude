---
title: Triggers
slug: anatomy/triggers
description: Events that start agent execution
sidebar:
  label: Triggers
  order: 1
---

Triggers define when your agent runs. They map directly to GitHub Actions workflow triggers, specifying which repository events should start the agent execution pipeline.

## How Triggers Work

When you define triggers in your agent's frontmatter, the compiler:

1. Aggregates all triggers into the dispatcher workflow
2. Creates a routing table mapping events to agents
3. When an event fires, the dispatcher routes it to matching agents

Multiple agents can respond to the same event, and a single agent can respond to multiple event types.

## Available Trigger Types

| Trigger | Description |
|---------|-------------|
| [Issues](/repo-agents/triggers/issues/) | Issue opened, edited, labeled, closed, etc. |
| [Pull Requests](/repo-agents/triggers/pull-requests/) | PR opened, synchronized, reviewed, merged |
| [Discussions](/repo-agents/triggers/discussions/) | Discussion created, answered, commented |
| [Schedule](/repo-agents/triggers/schedule/) | Cron-based scheduled runs |
| [Workflow Dispatch](/repo-agents/triggers/workflow-dispatch/) | Manual trigger with optional inputs |
| [Repository Dispatch](/repo-agents/triggers/repository-dispatch/) | Custom webhook events |

## Basic Syntax

Triggers are defined in the `on` field of your agent's frontmatter:

```yaml
---
name: My Agent
on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened]
---
```

## Multiple Triggers

An agent can respond to multiple event types:

```yaml
on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]
  schedule:
    - cron: '0 9 * * 1-5'
```

This agent runs when:
- A new issue is opened
- A new PR is opened
- Every weekday at 9 AM UTC
