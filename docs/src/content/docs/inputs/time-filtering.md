---
title: Time Filtering and Thresholds
description: Control time ranges and minimum data thresholds for input collection
---

The inputs system provides flexible time filtering and minimum item thresholds to ensure your agents run at the right time with appropriate data.

## The `since` Field

The `since` field controls the time range for data collection:

```yaml
inputs:
  issues:
    states: [all]
  since: last-run    # Time filter applies to all input types
```

The `since` value filters all configured input types (issues, PRs, commits, etc.) to only include data from the specified time range.

## Available Time Filters

### `last-run` (Default)

Collect data since the last successful workflow run.

```yaml
inputs:
  issues:
    states: [all]
  since: last-run
```

**How It Works:**
- Automatically finds when this workflow last ran successfully
- Uses that timestamp to collect only new data since then
- Falls back to 24 hours if this is the first run
- Ideal for scheduled reports that run regularly

**Best For:**
- Daily reports
- Regular monitoring
- Agents that run on a set schedule

**Example Workflow:**

```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
inputs:
  issues:
    states: [open, closed]
  since: last-run    # Collects since yesterday 9 AM
```

### `1h` (Last Hour)

Collect data from the last hour.

```yaml
inputs:
  workflow_runs:
    status: [failure]
  since: 1h
```

**Best For:**
- Frequent monitoring (every 15-30 minutes)
- Immediate issue detection
- High-velocity projects

**Example Workflow:**

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
inputs:
  workflow_runs:
    status: [failure]
  since: 1h
```

### `6h` (Last 6 Hours)

Collect data from the last 6 hours.

```yaml
inputs:
  issues:
    states: [open]
    labels: [critical]
  since: 6h
```

**Best For:**
- Every 6-hour checks
- Extended shift coverage
- Moderate-frequency monitoring

### `12h` (Last 12 Hours)

Collect data from the last 12 hours.

```yaml
inputs:
  commits:
    branches: [main]
  since: 12h
```

**Best For:**
- Twice-daily reports
- Multi-shift coverage
- Detailed daily briefings

### `24h` (Last 24 Hours)

Collect data from the last 24 hours.

```yaml
inputs:
  issues:
    states: [open, closed]
  pull_requests:
    states: [all]
  since: 24h
```

**Best For:**
- Daily reports
- Standard daily monitoring
- Same as `last-run` for daily agents

### `7d` (Last 7 Days)

Collect data from the last 7 days.

```yaml
inputs:
  commits:
    branches: [main]
  pull_requests:
    states: [merged]
  releases:
    prerelease: false
  since: 7d
```

**Best For:**
- Weekly reports
- Weekly digests
- Community summaries

**Example Workflow:**

```yaml
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
inputs:
  issues:
    states: [all]
  commits:
    branches: [main]
  since: 7d
```

### `30d` (Last 30 Days)

Collect data from the last 30 days.

```yaml
inputs:
  releases:
    prerelease: false
  commits:
    branches: [main]
  since: 30d
```

**Best For:**
- Monthly reports
- Quarterly reviews
- Long-term trend analysis

## How Time Filtering Works

When you set a `since` value, all configured input types are filtered to only include data from that time range onwards. For example, with `since: 24h`:

- **Issues**: Only issues updated in the last 24 hours
- **Pull Requests**: Only PRs updated in the last 24 hours
- **Commits**: Only commits created in the last 24 hours
- **Discussions**: Only discussions updated in the last 24 hours
- And so on...

The time filtering is inclusive - items at exactly the boundary time are included.

## The `min_items` Field

The `min_items` field sets the minimum number of items required before executing the agent:

```yaml
inputs:
  issues:
    states: [open]
  pull_requests:
    states: [open]
  min_items: 5    # Skip if fewer than 5 total items
```

### How the Threshold Works

The total count includes all items from all configured input types. For example:

```yaml
inputs:
  issues:
    states: [open]
  pull_requests:
    states: [open]
  min_items: 5
```

If this collects 3 issues and 4 PRs, that's 7 total items - above the threshold of 5, so the agent runs. If it collected 2 issues and 1 PR, that's only 3 total items - below the threshold, so the agent skips execution.

### Default Value

Default: `min_items: 1` (at least one item required)

### Examples

#### No Threshold

```yaml
inputs:
  issues:
    states: [open]
  min_items: 1  # Run even with just one issue
```

#### Alert Threshold

```yaml
inputs:
  workflow_runs:
    status: [failure]
  min_items: 1  # Run if any failures found
```

#### Digest Threshold

```yaml
inputs:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  min_items: 10  # Skip quiet periods
```

#### Report Threshold

```yaml
inputs:
  commits:
    branches: [main]
  pull_requests:
    states: [merged]
  issues:
    states: [closed]
  min_items: 5  # Need meaningful activity
```

### Use Cases

#### Daily Reports

Run even if activity is minimal:

```yaml
inputs:
  issues:
    states: [open, closed]
  commits:
    branches: [main]
  min_items: 1
```

#### Weekly Summaries

Only run if there was significant activity:

```yaml
inputs:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  commits:
    branches: [main]
  min_items: 10  # Skip quiet weeks
```

#### Alert Agents

Run immediately on any issue:

```yaml
inputs:
  workflow_runs:
    status: [failure]
  min_items: 1
```

#### Digest Emails

Only send if activity warrants:

```yaml
inputs:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  discussions:
    limit: 50
  min_items: 5
```

## Matching `since` to Your Schedule

Choose `since` values that match your schedule:

### Hourly Monitoring

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
inputs:
  since: 1h
```

### Every 15 Minutes

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'
inputs:
  since: 6h
```

### Twice Daily

```yaml
on:
  schedule:
    - cron: '0 9,17 * * *'  # 9 AM and 5 PM
inputs:
  since: 12h
```

### Daily

```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
inputs:
  since: last-run  # or 24h
```

### Weekly

```yaml
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
inputs:
  since: 7d
```

### Monthly

```yaml
on:
  schedule:
    - cron: '0 10 1 * *'  # First of month at 10 AM
inputs:
  since: 30d
```

## Choosing the Right Time Range

### Match Your Schedule

Choose a `since` value that matches your schedule:

```yaml
# For daily agents
on:
  schedule:
    - cron: '0 9 * * *'
inputs:
  since: last-run  # Automatically uses time since last run

# For weekly agents
on:
  schedule:
    - cron: '0 10 * * 1'
inputs:
  since: 7d

# For hourly monitoring
on:
  schedule:
    - cron: '0 * * * *'
inputs:
  since: 1h
```

### Balance Completeness and Specificity

Longer time ranges collect more data but may include less relevant items:

```yaml
# Shorter range - more focused
inputs:
  issues:
    states: [all]
  since: 1h

# Longer range - add filters to stay focused
inputs:
  issues:
    states: [open]
    labels: [bug]
  since: 30d
```

## Troubleshooting

### No Data Collected

If your agent skips execution with no data collected:

1. **Check `since` value**
   - Is the time range appropriate?
   - Did activity occur in that range?

2. **Check `min_items`**
   - Is the threshold too high?
   - Try lowering to 1 for testing

3. **Check filters**
   - Are labels/states too restrictive?
   - Try removing filters temporarily

### Data Appears Incomplete

If you're not getting all the data you expect:

1. **Increase time range**
   - Use a longer `since` period to capture more history

2. **Increase limits**
   - Raise the `limit` value for each input type

3. **Check for very large datasets**
   - Extremely large result sets may be truncated
   - Add more specific filters to narrow results

## Best Practices

### 1. Match to Schedule

```yaml
# Good
on:
  schedule:
    - cron: '0 9 * * *'
inputs:
  since: last-run  # Matches daily schedule
```

### 2. Set Appropriate Thresholds

```yaml
# Good - alert agents
inputs:
  workflow_runs:
    status: [failure]
  min_items: 1

# Good - digest agents
inputs:
  issues:
    states: [all]
  min_items: 10
```

### 3. Test Time Ranges

```yaml
# Use last-run for consistency
inputs:
  since: last-run  # Safest choice
```

### 4. Combine Time and Data Filters

```yaml
# Efficient filtering
inputs:
  issues:
    states: [open]
    labels: [bug]
  since: 7d  # Shorter range with specific filters
```

## See Also

- [Overview](./): Main inputs documentation
- [Issues](./issues/): Issues input configuration
- [Pull Requests](./pull-requests/): PR input configuration
- [Commits](./commits/): Commits input configuration
