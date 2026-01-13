---
title: Quick Start
description: Get started with gh-claude in minutes
---

This guide will walk you through creating your first Claude-powered GitHub Actions workflow.

## 1. Initialize Your Repository

Navigate to your repository and initialize gh-claude:

```bash
cd your-repo
gh claude init --examples
```

This creates:
- `.github/claude-agents/` - Directory for agent markdown files
- Example agent templates to help you get started

## 2. Configure Authentication

Run the interactive setup wizard:

```bash
gh claude setup
```

This guides you through Claude API authentication and optional GitHub App setup.

Alternatively, configure just the API key:

```bash
gh claude setup-token
```

## 3. Create Your First Agent

Create a new file at `.github/claude-agents/issue-triage.md`:

```markdown
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

# Issue Triage Agent

Analyze new issues and:

1. Categorize with appropriate labels (bug, feature, documentation, question)
2. Assess priority (high, medium, low)
3. Welcome the contributor with a friendly comment

Be helpful and welcoming!
```

## 4. Compile to Workflows

Generate GitHub Actions workflows from all your agents:

```bash
gh claude compile
```

This creates:
- `.github/workflows/claude-dispatcher.yml` - Central dispatcher that handles all triggers
- `.github/workflows/claude-issue-triage.yml` - Your issue triage agent workflow

**What's the dispatcher?** It's a centralized workflow that aggregates all triggers, validates configuration, and routes events to the appropriate agents.

## 5. Commit and Deploy

Commit your changes and push to GitHub:

```bash
git add .github/
git commit -m "Add Claude issue triage agent"
git push
```

## Test Your Agent

Create a new issue in your repository. The agent should automatically:
- Add appropriate labels
- Post a welcoming comment

Check the **Actions** tab to see the workflow execution and logs.

## Understanding the Dispatcher

The dispatcher pattern provides:
- **Shared validation**: API keys and permissions checked once
- **Self-healing**: Creates issues and disables itself if misconfigured
- **Efficient routing**: Only runs agents that match the event
- **Centralized triggers**: All event subscriptions in one place

## What's Next?

- Learn about [Agent Definition](../../guide/agent-definition/) format
- Understand [How It Works](../../guide/how-it-works/) with the dispatcher architecture
- Explore [Triggers](../../triggers/) for different events
- See more [Examples](../../examples/issue-triage/)
