---
title: Stars & Forks
description: Track repository star and fork counts
---

The stars and forks context options provide your agent with current repository popularity metrics. These are simple boolean flags that fetch the latest counts from GitHub, giving Claude awareness of your repository's community size.

## Basic Example

```yaml
context:
  stars: true
  forks: true
```

## Configuration Options

```yaml
context:
  stars: true                # boolean — default: false
  forks: true                # boolean — default: false
```

**stars** — Include the repository's star count.

**forks** — Include the repository's fork count.

## Best Practices

Include stars and forks as part of a broader context configuration rather than relying on them alone. They work well alongside issues, pull requests, and commits to give Claude a complete picture of repository activity and health.

Since these metrics are lightweight API calls, there is no performance penalty for enabling them. Consider adding them to any scheduled reporting agent where repository growth or community size is relevant context.

When setting `min_items` thresholds, remember that stars and forks each count as exactly one item regardless of their actual values. Design your threshold based on the other context types you're collecting, treating stars and forks as bonus context rather than primary triggers.

## More Examples

<details>
<summary>Example: Weekly Repository Metrics Report</summary>

```yaml
---
name: Weekly Repository Metrics
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
  workflow_dispatch: {}
permissions:
  discussions: write
  issues: read
  pull_requests: read
outputs:
  create-discussion: true
context:
  stars: true
  forks: true
  issues:
    states: [all]
  pull_requests:
    states: [merged]
  since: 7d
  min_items: 1
---

Create a weekly report discussion with repository metrics:

1. **Community Growth**: Current stars and forks counts
2. **Activity Summary**: Issues opened/closed and PRs merged
3. **Trends**: Notable patterns in engagement

Celebrate any milestone numbers reached!
```

</details>

<details>
<summary>Example: Community Health Dashboard</summary>

```yaml
---
name: Community Health Dashboard
on:
  schedule:
    - cron: '0 10 * * *'  # Daily at 10 AM
  workflow_dispatch: {}
permissions:
  discussions: write
  issues: read
  pull_requests: read
outputs:
  create-discussion: true
context:
  stars: true
  forks: true
  issues:
    states: [open, closed]
    limit: 100
  pull_requests:
    states: [open, merged]
    limit: 100
  discussions:
    limit: 50
  commits:
    branches: [main]
    limit: 200
  since: 7d
  min_items: 5
---

Generate a comprehensive community health dashboard including:

1. **Growth Metrics**: Stars, forks, and overall trajectory
2. **Activity Levels**: Issue velocity, PR throughput, commit frequency
3. **Community Engagement**: Discussion participation and response times
4. **Health Assessment**: Overall project health score and recommendations

Format the dashboard with clear sections and highlight any areas needing attention.
```

</details>

<details>
<summary>Example: Lightweight Metrics Only</summary>

```yaml
---
name: Quick Stats Check
on:
  workflow_dispatch: {}
permissions:
  issues: write
outputs:
  create-issue: true
context:
  stars: true
  forks: true
  min_items: 1
---

Create a simple issue with current repository statistics.
Include the star count and fork count, and note if either
number appears to be a milestone (100, 500, 1000, etc.).
```

</details>
