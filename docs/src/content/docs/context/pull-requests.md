---
title: Pull Requests
description: Collect and filter repository pull requests
---

The pull requests context type collects PRs from your repository and provides them to Claude for analysis. This is useful for agents that need to review code changes, track review queues, monitor merge activity, or generate reports on development velocity.

## Basic Example

```yaml
context:
  pull_requests:
    states: [open]
    limit: 50
  since: 24h
```

## Configuration Options

```yaml
context:
  pull_requests:
    states: [open]           # string[] — default: all
    labels: [ready]          # string[]
    exclude_labels: [wip]    # string[]
    assignees: [alice]       # string[]
    creators: [bob]          # string[]
    reviewers: [charlie]     # string[]
    base_branch: main        # string
    head_branch: feature     # string
    limit: 100               # number — default: 100
```

**states** — Which PR states to include: `open`, `closed`, `merged`, or `all`.

**labels** — Filter to PRs with at least one of these labels (case-sensitive, exact match).

**exclude_labels** — Remove PRs that have any of these labels; applied after inclusions.

**assignees** — Filter to PRs assigned to specific GitHub usernames.

**creators** — Restrict to PRs created by specific GitHub usernames.

**reviewers** — Filter to PRs where specific usernames have been requested as reviewers.

**base_branch** — Return only PRs targeting this branch (exact match).

**head_branch** — Filter by the source branch of the PR (exact match).

**limit** — Maximum number of PRs to retrieve (1-1000).

## Best Practices

When configuring pull request collection, start with focused filters rather than collecting everything. An agent that processes 500 PRs will use more tokens and may miss important patterns in the noise. Use the `states`, `labels`, and `base_branch` options together to narrow down to exactly what your agent needs.

For review queue monitoring, combine `states: [open]` with `labels: [ready-to-review]` and `exclude_labels: [wip, draft, blocked]`. This ensures your agent only sees PRs that are actually ready for attention.

Match your `limit` to your agent's schedule. A daily agent might need 100 PRs to catch everything, while an hourly agent only needs to see the most recent 20 or 30. The `since` parameter at the context level helps further reduce noise by only including PRs updated within a time window.

When tracking specific workflows like hotfixes, use `head_branch` with your branch naming convention. However, remember this requires exact matching, so consider whether you need multiple agents for different branch patterns.

## More Examples

<details>
<summary>Example: Review queue with exclusions</summary>

```yaml
---
name: Review Queue Monitor
on:
  schedule:
    - cron: '0 9 * * 1-5'
  workflow_dispatch: {}
permissions:
  pull_requests: read
  issues: write
context:
  pull_requests:
    states: [open]
    labels: [ready-to-review]
    exclude_labels: [wip, blocked, draft, needs-discussion]
    base_branch: main
    limit: 50
  since: last-run
  min_items: 1
---

Review the pending PRs and identify any that have been waiting more than 3 days.
Create an issue summarizing the review backlog with recommendations for prioritization.
```

</details>

<details>
<summary>Example: Team member PR tracking</summary>

```yaml
---
name: Team PR Summary
on:
  schedule:
    - cron: '0 17 * * 5'
  workflow_dispatch: {}
permissions:
  pull_requests: read
  discussions: write
outputs:
  create-discussion: true
context:
  pull_requests:
    states: [open, merged]
    creators: [alice, bob, charlie]
    limit: 100
  since: 7d
  min_items: 1
---

Generate a weekly summary of team PR activity including:
- PRs merged this week
- PRs still in review
- Average time to merge
Post this as a discussion in the Team category.
```

</details>

<details>
<summary>Example: Merged PR release notes</summary>

```yaml
---
name: Release Notes Generator
on:
  workflow_dispatch: {}
permissions:
  pull_requests: read
  contents: write
outputs:
  update-file: true
context:
  pull_requests:
    states: [merged]
    base_branch: main
    labels: [feature, bugfix, enhancement]
    limit: 50
  since: last-run
  min_items: 1
---

Analyze the merged PRs and generate release notes in CHANGELOG.md format.
Group changes by type (Features, Bug Fixes, Improvements) and include PR numbers.
```

</details>

<details>
<summary>Example: Hotfix monitoring</summary>

```yaml
---
name: Hotfix Tracker
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch: {}
permissions:
  pull_requests: read
  issues: write
outputs:
  add-comment: true
context:
  pull_requests:
    states: [open]
    labels: [hotfix, critical]
    base_branch: main
    limit: 20
  since: 1h
  min_items: 1
---

Check for any hotfix PRs that have been open for more than 2 hours.
Add a comment to the PR reminding the team about the urgency and tagging relevant reviewers.
```

</details>

<details>
<summary>Example: Stale PR cleanup</summary>

```yaml
---
name: Stale PR Finder
on:
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch: {}
permissions:
  pull_requests: write
outputs:
  add-comment: true
  add-label: true
context:
  pull_requests:
    states: [open]
    exclude_labels: [keep-open, long-running]
    limit: 100
  since: 30d
---

Find PRs that have been open for more than 14 days without recent activity.
Add the "stale" label and post a comment asking if the PR is still being worked on.
```

</details>
