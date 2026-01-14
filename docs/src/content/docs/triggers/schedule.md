---
title: Schedule Triggers
description: Run agents on a recurring schedule
---

Schedule triggers allow your agent to run automatically at specified times using cron syntax. This is ideal for periodic tasks like generating reports, cleaning up stale issues, or monitoring repository health.

## Basic Example

```yaml
---
name: Weekly Report
on:
  schedule:
    - cron: '0 9 * * MON'
permissions:
  issues: read
---

Generate a weekly summary of repository activity.
```

## Configuration Options

```yaml
on:
  schedule:
    - cron: '0 9 * * MON'    # required — cron expression (UTC)
    - cron: '0 17 * * FRI'   # multiple schedules supported
```

**cron** — Standard cron expression with 5 fields: minute, hour, day-of-month, month, day-of-week. All times are UTC. Supports special characters: `*` (any), `,` (list), `-` (range), `/` (step).

## Best Practices

Choose appropriate frequencies that match your task requirements. A daily summary makes sense for active repositories, while a weekly cleanup may be sufficient for maintenance tasks. Avoid running agents more frequently than necessary to conserve API credits and reduce noise.

Schedule resource-intensive agents during off-peak hours when possible. Running at times like 2am or 3am UTC can help avoid contention with other workflows and may provide more consistent execution times.

Combine schedule triggers with `workflow_dispatch` to allow manual execution during development and testing. This lets you verify your agent works correctly before relying on the automated schedule.

When using scheduled agents to process time-sensitive data, consider the potential for delayed execution. GitHub Actions may delay scheduled workflows during periods of high platform load, so avoid relying on precise timing for critical operations.

## More Examples

<details>
<summary>Example: Daily stale issue cleanup</summary>

```yaml
---
name: Stale Issue Cleanup
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
permissions:
  issues: write
context:
  issues:
    states: [open]
    labels: [stale]
  since: 7d
---

Review issues labeled as stale. Close any that have had no activity
in the past 7 days and leave a comment explaining the closure.
```

</details>

<details>
<summary>Example: Multiple schedules for different tasks</summary>

```yaml
---
name: Repository Monitor
on:
  schedule:
    - cron: '0 9 * * MON-FRI'
    - cron: '0 17 * * MON-FRI'
permissions:
  issues: read
  pull_requests: read
---

Check repository health twice daily on weekdays. Report any PRs
that have been open for more than 48 hours without review.
```

</details>

<details>
<summary>Example: Monthly metrics report</summary>

```yaml
---
name: Monthly Contributor Report
on:
  schedule:
    - cron: '0 10 1 * *'
permissions:
  discussions: write
context:
  commits:
    limit: 500
  pull_requests:
    states: [merged]
  since: 30d
outputs:
  create-discussion: true
---

Generate a monthly report recognizing contributors. Summarize
commits merged and PRs completed, then post as a discussion.
```

</details>

<details>
<summary>Example: Hourly security scan</summary>

```yaml
---
name: Security Monitor
on:
  schedule:
    - cron: '0 */4 * * *'
rate_limit_minutes: 240
permissions:
  issues: write
context:
  workflow_runs:
    status: [failure]
    workflows: [security-scan]
  since: 4h
  min_items: 1
---

Every 4 hours, check for failed security scan workflows.
Create an issue if any failures are detected.
```

</details>
