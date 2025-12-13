---
title: Inputs System
description: Collect and analyze repository data before agent execution
---

The inputs system enables agents to collect repository data before execution. This is essential for scheduled agents that create reports, summaries, or alerts based on repository activity.

## What Are Inputs?

Inputs allow your agents to collect repository data before execution. Add them to your agent frontmatter to give Claude context about issues, pull requests, commits, and more.

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 50
  pull_requests:
    states: [merged]
    limit: 30
  since: last-run    # Time range for data collection
  min_items: 1       # Skip execution if below threshold
```

**Key Feature:** Agents with inputs will **automatically skip execution** if insufficient data is collected, preventing unnecessary API usage and costs.

## How Inputs Work

When you configure inputs in your agent:

1. **Data Collection**: Repository data is collected based on your configuration
2. **Formatting**: Data is formatted as markdown sections for Claude to read
3. **Threshold Check**: If total items collected is less than `min_items`, the agent skips execution
4. **Agent Execution**: If enough data is collected, Claude receives it and executes your agent instructions

## Controlling Execution with `min_items`

Use `min_items` to prevent agent execution when there's not enough data:

```yaml
inputs:
  issues:
    states: [open]
  pull_requests:
    states: [open]
  min_items: 5    # Skip if fewer than 5 total items collected
```

**What Claude receives:**
- All configured input types are collected
- Total items are counted across all types
- If total is below `min_items`, agent doesn't run
- If total meets threshold, all data is passed to Claude

**Default:** `min_items: 1` (at least one item required)

## When to Use Inputs

Inputs are useful for:

- **Scheduled Reports**: Generate daily/weekly summaries of repository activity
- **Monitoring**: Track workflow failures, bugs, or performance issues
- **Alerts**: Notify on specific conditions (new critical issues, failed deployments)
- **Digests**: Aggregate activity for email or discussion posts
- **Analysis**: Process data and generate insights or recommendations
- **Resource Planning**: Track metrics like star count, fork count, or contributor activity

## Quick Examples

### Daily Activity Report

Monitor activity over the last 24 hours:

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 50
  pull_requests:
    states: [all]
    limit: 50
  commits:
    branches: [main]
    limit: 100
  since: last-run
  min_items: 1
```

### Failure Monitoring

Alert on workflow failures and critical issues:

```yaml
inputs:
  workflow_runs:
    status: [failure]
    limit: 50
  issues:
    states: [open]
    labels: [bug, critical]
    limit: 100
  since: last-run
  min_items: 1
```

### Weekly Digest

Comprehensive weekly summary:

```yaml
inputs:
  issues:
    states: [all]
    limit: 200
  pull_requests:
    states: [all]
    limit: 200
  commits:
    branches: [main]
    limit: 500
  releases:
    prerelease: true
    limit: 20
  stars: true
  forks: true
  since: 7d
  min_items: 5
```

## Input Types

Choose from these data collection types:

| Type | Purpose | Link |
|------|---------|------|
| **Issues** | Collect repository issues | [View →](./issues/) |
| **Pull Requests** | Collect pull requests | [View →](./pull-requests/) |
| **Discussions** | Collect repository discussions | [View →](./discussions/) |
| **Commits** | Collect commits from specified branches | [View →](./commits/) |
| **Releases** | Collect releases and pre-releases | [View →](./releases/) |
| **Workflow Runs** | Collect workflow execution data | [View →](./workflow-runs/) |
| **Stars** | Track repository star count | [View →](./stars-and-forks/) |
| **Forks** | Track repository fork count | [View →](./stars-and-forks/) |

## Time Filtering

The `since` field controls the time range for data collection:

```yaml
inputs:
  issues:
    states: [all]
  since: last-run    # Time filter applies to all input types
```

See [Time Filtering and Thresholds](./time-filtering/) for detailed information on:
- `last-run` (default)
- `1h`, `6h`, `12h`, `24h` (hours)
- `7d`, `30d` (days)
- How to choose the right time range
- Using `min_items` thresholds

## Complete Configuration Example

Here's a comprehensive example showing multiple input types:

```yaml
---
name: Weekly Repository Digest
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
  workflow_dispatch: {}
permissions:
  discussions: write
  issues: read
  pull_requests: read
  contents: read
outputs:
  create-discussion: true
inputs:
  issues:
    states: [open, closed]
    exclude_labels: [duplicate, invalid]
    limit: 100
  pull_requests:
    states: [merged, open]
    limit: 50
  discussions:
    categories: [Announcements]
    limit: 20
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate]
    limit: 200
  releases:
    prerelease: false
    draft: false
    limit: 10
  workflow_runs:
    status: [failure]
    limit: 30
  stars: true
  forks: true
  since: 7d        # Last 7 days
  min_items: 5     # Skip if fewer than 5 items
---

You are a weekly digest agent that creates engaging repository summaries.

Analyze the collected data and create a discussion post with:

1. **Highlights**: Key achievements and milestones
2. **Activity Summary**: Issues, PRs, commits by the numbers
3. **Releases**: New versions and features shipped
4. **Community**: New contributors and stars growth
5. **Issues**: Failed workflows and blockers that need attention

Make it informative, concise, and celebrate wins!
```

## What Data Does Claude Receive?

When you configure inputs, Claude receives formatted markdown with all collected data. For example:

```markdown
## 📋 Issues

### [#42] Fix authentication bug
**State:** open | **Author:** @user | **Updated:** 2024-01-15T10:30:00Z
**Labels:** bug, high-priority
**URL:** https://github.com/owner/repo/issues/42

Users are experiencing authentication failures when...
---

## 🔀 Pull Requests

### [#15] Add user authentication
**State:** open | **Author:** @developer | **Updated:** 2024-01-15T09:00:00Z
**Branch:** feature/auth → main
**Labels:** feature, needs-review
**URL:** https://github.com/owner/repo/pull/15

This PR adds JWT-based authentication...
---

## 📝 Commits

- [`a1b2c3d`](https://github.com/owner/repo/commit/a1b2c3d) Add user authentication - @developer (2024-01-15T10:00:00Z)
- [`e4f5g6h`](https://github.com/owner/repo/commit/e4f5g6h) Fix validation bug - @developer (2024-01-15T09:30:00Z)
---
```

Each input type has its own section with relevant details formatted for easy reading.

## Best Practices

### 1. Use Appropriate Time Ranges

Match `since` to your schedule:

```yaml
# Hourly monitoring
on:
  schedule:
    - cron: '0 * * * *'
inputs:
  since: 1h

# Daily reports
on:
  schedule:
    - cron: '0 9 * * *'
inputs:
  since: last-run  # or 24h

# Weekly digests
on:
  schedule:
    - cron: '0 10 * * 1'
inputs:
  since: 7d
```

### 2. Set Reasonable Limits

Balance completeness with performance:

```yaml
# Good - focused data
inputs:
  issues:
    states: [open]
    labels: [bug]
    limit: 50

# Avoid - too broad
inputs:
  issues:
    states: [all]
    limit: 1000  # May timeout or exceed limits
```

### 3. Use Filters Effectively

Reduce noise with filters:

```yaml
# Good - specific filtering
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]

# Avoid - no filtering
inputs:
  commits:
    limit: 500  # Includes bot commits
```

### 4. Set Appropriate Thresholds

Prevent unnecessary runs:

```yaml
# Alert agents - run on any issue
inputs:
  workflow_runs:
    status: [failure]
  min_items: 1

# Digest reports - require meaningful activity
inputs:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  min_items: 10  # Skip quiet weeks
```

### 5. Combine Related Inputs

Group related data for comprehensive analysis:

```yaml
# Good - related data
inputs:
  issues:
    states: [open, closed]
  pull_requests:
    states: [merged]
  commits:
    branches: [main]

# This allows Claude to see the complete picture:
# - Issues opened/closed
# - PRs merged
# - Commits that fixed issues
```

## Troubleshooting

### No Data Collected

If your agent skips execution with no data:

1. **Check time range**: Ensure `since` matches when activity occurred
2. **Verify filters**: Labels/states may be too restrictive
3. **Review min_items**: Try lowering to 1 for testing
4. **Check repository activity**: May genuinely be quiet during that period

### Missing Expected Data

If data you expect doesn't appear:

1. **Verify time filter**: Data may be outside your `since` range
2. **Check filters**: Labels, states, or authors may exclude it
3. **Review limit**: You may need a higher limit value
4. **Check workflow logs**: Look for collection errors

### Too Much Data

If you're getting more data than needed:

1. **Add filters**: Use labels, states, authors to narrow results
2. **Reduce limit**: Lower the maximum items collected
3. **Shorten time range**: Use a shorter `since` period
4. **Be more specific**: Target specific branches, milestones, etc.

## Next Steps

- Learn about specific input types:
  - [Issues](./issues/)
  - [Pull Requests](./pull-requests/)
  - [Discussions](./discussions/)
  - [Commits](./commits/)
  - [Releases](./releases/)
  - [Workflow Runs](./workflow-runs/)
  - [Stars & Forks](./stars-and-forks/)
- Understand [Time Filtering and Thresholds](./time-filtering/)
- See [How It Works](../guide/how-it-works/) for workflow execution details
- Learn about [Outputs](../guide/outputs/) to act on collected data
