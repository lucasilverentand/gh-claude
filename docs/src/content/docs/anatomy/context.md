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

### Core Repository Data
| Context | Description |
|---------|-------------|
| [Issues](/repo-agents/context/issues/) | Repository issues with state, label, and assignee filters |
| [Pull Requests](/repo-agents/context/pull-requests/) | Pull requests with state, label, and reviewer filters |
| [Discussions](/repo-agents/context/discussions/) | Discussions with category and answered state filters |
| [Comments](/repo-agents/context/comments/) | Comments from issues, PRs, and discussions |
| [Commits](/repo-agents/context/commits/) | Recent commits with branch and author filters |
| [Branches](/repo-agents/context/branches/) | Repository branches with staleness detection |

### Releases & Deployments
| Context | Description |
|---------|-------------|
| [Releases](/repo-agents/context/releases/) | Repository releases including prereleases and drafts |
| [Deployments](/repo-agents/context/deployments/) | Deployment history with environment and status filters |

### CI/CD & Quality
| Context | Description |
|---------|-------------|
| [Workflow Runs](/repo-agents/context/workflow-runs/) | GitHub Actions workflow run results |
| [Check Runs](/repo-agents/context/check-runs/) | Check runs from workflows with status filters |

### Security & Dependencies
| Context | Description |
|---------|-------------|
| [Security Alerts](/repo-agents/context/security-alerts/) | Dependabot security alerts with severity filters |
| [Dependabot PRs](/repo-agents/context/dependabot-prs/) | Automated dependency update pull requests |
| [Code Scanning Alerts](/repo-agents/context/code-scanning-alerts/) | CodeQL and security scanning results |

### Project Management
| Context | Description |
|---------|-------------|
| [Milestones](/repo-agents/context/milestones/) | Repository milestones with progress tracking |

### Repository Metrics
| Context | Description |
|---------|-------------|
| [Contributors](/repo-agents/context/contributors/) | Repository contributors with activity tracking |
| [Repository Traffic](/repo-agents/context/repository-traffic/) | Views, clones, referrers, and popular paths |
| [Stars & Forks](/repo-agents/context/stars-and-forks/) | Repository star and fork counts |

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
