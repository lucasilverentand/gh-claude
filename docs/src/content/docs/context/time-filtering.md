---
title: Time Filtering
description: Control time ranges and minimum data thresholds for context collection
---

Time filtering controls what data your agent receives when collecting repository context. The `since` field determines how far back to look for activity, while `min_items` sets a threshold that must be met before the agent executes.

```yaml
name: Weekly Digest
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
context:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  since: 7d
  min_items: 3
```

## Options

```yaml
context:
  since: 24h                 # string — default: last-run
  min_items: 5               # number — default: 1
```

**since** — Time window for filtering: `last-run`, or duration like `24h`, `7d`.

**min_items** — Minimum items required to proceed with agent execution.

## Best Practices

Match your `since` duration to your schedule frequency. A daily agent works well with `since: last-run` or `since: 24h`, while a weekly summary agent should use `since: 7d`. Using `last-run` is often the safest choice because it automatically adapts if your schedule changes or a run is delayed.

Set `min_items` based on what makes sense for your agent's purpose. Alert-style agents that need to respond to any problem should use `min_items: 1` (the default), while digest or summary agents might benefit from a higher threshold like 5 or 10 to avoid generating sparse reports during quiet periods.

When collecting large amounts of data over longer time ranges, consider adding filters to individual context types (like specific labels or states) to keep the collected context focused and relevant. This reduces noise and helps the AI agent produce more targeted responses.

## More Examples

<details>
<summary>Example: Hourly failure monitoring</summary>

```yaml
name: CI Failure Monitor
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
context:
  workflow_runs:
    status: [failure]
  since: 1h
  min_items: 1
```

This configuration runs every hour and checks for any failed workflow runs in the past hour. The agent only executes if at least one failure is found.

</details>

<details>
<summary>Example: Daily activity digest</summary>

```yaml
name: Daily Digest
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
context:
  issues:
    states: [open, closed]
  pull_requests:
    states: [all]
  commits:
    branches: [main]
  since: last-run
  min_items: 5
```

Using `last-run` ensures the digest captures all activity since yesterday's run without gaps. The threshold of 5 items prevents sending sparse reports on quiet days.

</details>

<details>
<summary>Example: Monthly report with longer lookback</summary>

```yaml
name: Monthly Report
on:
  schedule:
    - cron: '0 10 1 * *'  # First of each month at 10 AM
context:
  releases:
    prerelease: false
  commits:
    branches: [main]
  issues:
    states: [closed]
  pull_requests:
    states: [merged]
  since: 30d
  min_items: 10
```

For monthly reports, a 30-day lookback captures the full month of activity. A higher minimum threshold ensures the report only generates when there's meaningful content to summarize.

</details>

<details>
<summary>Example: Twice-daily check with 12-hour window</summary>

```yaml
name: Shift Handoff Report
on:
  schedule:
    - cron: '0 9,21 * * *'  # 9 AM and 9 PM
context:
  issues:
    states: [open]
    labels: [critical, urgent]
  pull_requests:
    states: [open]
    labels: [needs-review]
  since: 12h
  min_items: 1
```

Running twice daily with a 12-hour window provides complete coverage. Filtering to specific labels keeps the context focused on items requiring attention.

</details>
