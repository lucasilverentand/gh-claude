---
title: Pull Requests Input Type
description: Collect and filter repository pull requests
---

Collect pull requests from your repository with comprehensive filtering options.

## Configuration

```yaml
inputs:
  pull_requests:
    states: [open, closed, merged, all]
    labels: [ready-to-review]
    exclude_labels: [wip]
    assignees: [username]
    creators: [username]
    reviewers: [username]
    base_branch: main
    head_branch: feature/*
    limit: 100
```

## Configuration Options

- **`states`** (array): Filter by state
  - `open` - Open pull requests only
  - `closed` - Closed (unmerged) pull requests only
  - `merged` - Merged pull requests only
  - `all` - All pull requests

- **`labels`** (array): Only PRs with these labels (case-sensitive)
  - Can include multiple labels
  - PRs must have all specified labels

- **`exclude_labels`** (array): Exclude PRs with these labels
  - Removes PRs matching any of these labels
  - Useful for filtering out WIP, draft, etc.

- **`assignees`** (array): Only PRs assigned to these users
  - Specify GitHub usernames

- **`creators`** (array): Only PRs created by these users
  - Specify GitHub usernames

- **`reviewers`** (array): Only PRs with these reviewers
  - Filters to PRs where specified users are reviewers
  - Useful for tracking code review bottlenecks

- **`base_branch`** (string): Only PRs targeting this branch
  - Usually `main` or `master`
  - Targets the merge destination

- **`head_branch`** (string): Only PRs from this branch
  - Supports wildcards: `feature/*`, `hotfix/*`
  - Filters the source branch

- **`limit`** (number): Maximum PRs to fetch
  - Default: `100`
  - Maximum: `1000`

## Output Format

When Claude receives pull requests data, it's formatted like this:

```markdown
## 🔀 Pull Requests

### [#15] Add user authentication
**State:** open | **Author:** @developer | **Updated:** 2024-01-15T09:00:00Z
**Branch:** feature/auth → main
**Labels:** feature, needs-review
**URL:** https://github.com/owner/repo/pull/15

This PR adds JWT-based authentication...
---

### [#14] Fix typo in README
**State:** closed (merged) | **Author:** @contributor | **Updated:** 2024-01-14T18:30:00Z
**Branch:** fix/readme-typo → main
**Labels:** documentation
**URL:** https://github.com/owner/repo/pull/14

Fixed spelling mistake in installation instructions.
---
```

Each PR includes:
- PR number and title
- Current state (open/closed/merged)
- Author username
- Last update timestamp
- Source branch → target branch
- Associated labels
- Direct link to the PR
- PR body/description

## Configuration Examples

### Open PRs Awaiting Review

Collect PRs waiting for review:

```yaml
inputs:
  pull_requests:
    states: [open]
    labels: [ready-to-review]
    exclude_labels: [wip, blocked]
    limit: 50
```

### Recently Merged

Collect recently merged PRs:

```yaml
inputs:
  pull_requests:
    states: [merged]
    limit: 100
```

### By Developer

Collect PRs created by specific developers:

```yaml
inputs:
  pull_requests:
    states: [open, merged]
    creators: [alice, bob]
    limit: 100
```

### To Main Branch

Only PRs targeting your main branch:

```yaml
inputs:
  pull_requests:
    states: [open]
    base_branch: main
    limit: 100
```

### By Branch Pattern

Collect PRs from feature branches:

```yaml
inputs:
  pull_requests:
    states: [open]
    head_branch: feature/*
    limit: 100
```

### Needs Review

PRs awaiting specific reviewer approval:

```yaml
inputs:
  pull_requests:
    states: [open]
    reviewers: [alice]
    limit: 50
```

### Blocked PRs

Track PRs that are blocked:

```yaml
inputs:
  pull_requests:
    states: [open]
    labels: [blocked]
    exclude_labels: [wip]
    limit: 100
```

### Hotfix PRs

Track critical hotfix pull requests:

```yaml
inputs:
  pull_requests:
    states: [open, merged]
    head_branch: hotfix/*
    labels: [critical]
    limit: 50
```

## Use Cases

### 1. Code Review Queue

Identify PRs waiting for review:

```yaml
inputs:
  pull_requests:
    states: [open]
    labels: [ready-to-review]
    exclude_labels: [wip, blocked]
    limit: 100
  since: last-run
  min_items: 1
```

Claude could notify reviewers about pending reviews or identify bottlenecks.

### 2. Deployment Readiness

Track PRs that can be deployed:

```yaml
inputs:
  pull_requests:
    states: [merged]
    base_branch: main
    labels: [tested]
    limit: 50
  since: 24h
  min_items: 1
```

Claude could prepare release notes from merged PRs.

### 3. Team Velocity

Monitor team productivity:

```yaml
inputs:
  pull_requests:
    states: [merged]
    creators: [alice, bob, charlie]
    limit: 100
  since: 7d
  min_items: 1
```

Claude could generate weekly team reports showing PR velocity.

### 4. Feature Branch Cleanup

Identify stale feature branches:

```yaml
inputs:
  pull_requests:
    states: [open, closed]
    head_branch: feature/*
    limit: 100
  since: 30d
```

Claude could identify and suggest cleanup of abandoned branches.

### 5. Hotfix Tracking

Monitor critical hotfixes:

```yaml
inputs:
  pull_requests:
    states: [open, merged]
    head_branch: hotfix/*
    labels: [critical]
    limit: 50
  since: last-run
  min_items: 1
```

Claude could alert the team about critical hotfixes needing attention.

## Real-World Example

A code review queue agent that monitors pending reviews:

```yaml
---
name: Code Review Monitor
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
  workflow_dispatch: {}
permissions:
  pull_requests: read
  issues: write
outputs:
  add-comment: true
inputs:
  pull_requests:
    states: [open]
    labels: [ready-to-review]
    exclude_labels: [wip, blocked, draft]
    limit: 100
  since: last-run
  min_items: 1
---

Analyze the pending PRs and create a summary with:

1. **High Priority**: PRs blocking releases or marked critical
2. **By Reviewer**: PRs grouped by reviewer
3. **Wait Time**: Sort by days waiting for review
4. **Stale PRs**: PRs waiting more than 3 days

Add comments to PRs that have been waiting too long (> 5 days)
reminding reviewers to prioritize them.
```

## Performance Tips

### Filter Effectively

Use multiple filters to reduce result set:

```yaml
# Better - specific filters
inputs:
  pull_requests:
    states: [open]
    labels: [ready-to-review]
    exclude_labels: [wip, draft, blocked]
    base_branch: main
    limit: 50
```

### By Branch

Target specific branches to reduce noise:

```yaml
# Only PRs targeting production
inputs:
  pull_requests:
    states: [open]
    base_branch: main
    limit: 50
```

### Exclude Work in Progress

Skip WIP and draft PRs:

```yaml
inputs:
  pull_requests:
    states: [open]
    exclude_labels: [wip, draft, work-in-progress]
    limit: 100
```

## Common Configurations

### Review Queue

```yaml
pull_requests:
  states: [open]
  labels: [ready-to-review]
  exclude_labels: [wip, blocked]
  limit: 100
```

### Merge Monitoring

```yaml
pull_requests:
  states: [merged]
  base_branch: main
  limit: 100
```

### Team Activity

```yaml
pull_requests:
  states: [open, merged]
  creators: [alice, bob, charlie]
  limit: 100
```

### Critical PRs

```yaml
pull_requests:
  states: [open]
  labels: [critical, urgent]
  limit: 50
```

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Issues](./issues/): Similar filtering for issues
- [Discussions](./discussions/): Collect discussion posts
