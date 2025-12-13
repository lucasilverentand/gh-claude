---
title: Stars and Forks Input Types
description: Track repository star and fork counts
---

Track repository star count and fork count metrics for monitoring repository growth and community engagement.

## Stars Configuration

```yaml
inputs:
  stars: true
```

Track the current number of stars your repository has received.

### Output Format

When Claude receives stars data, it's formatted like this:

```markdown
## ⭐ Stars: 1,234
```

The star count is displayed with thousands separator for readability.

### Use Cases

#### 1. Growth Reporting

Monitor star growth in reports:

```yaml
inputs:
  issues:
    states: [all]
  stars: true
  since: 7d
  min_items: 5
```

Claude could mention star count in weekly reports.

#### 2. Milestone Celebration

Alert when reaching star milestones:

```yaml
inputs:
  stars: true
  since: last-run
  min_items: 1
```

Claude could create celebration posts when reaching round numbers (1000, 5000, etc.).

#### 3. Community Health Report

Include star count in health metrics:

```yaml
inputs:
  stars: true
  forks: true
  issues:
    states: [open]
  pull_requests:
    states: [open]
  since: 30d
  min_items: 1
```

Claude could generate comprehensive community engagement reports.

### Real-World Example

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
inputs:
  stars: true
  forks: true
  issues:
    states: [all]
  pull_requests:
    states: [merged]
  since: 7d
  min_items: 1
---

Create a weekly report with repository metrics:

1. **Community Growth**: Stars and forks this week
2. **Activity**: Issues and PRs
3. **Engagement**: Trends and insights

Celebrate milestones when reached!
```

## Forks Configuration

```yaml
inputs:
  forks: true
```

Track the current number of forks your repository has received.

### Output Format

When Claude receives forks data, it's formatted like this:

```markdown
## 🍴 Forks: 56
```

The fork count is displayed with thousands separator for readability.

### Use Cases

#### 1. Growth Tracking

Monitor fork growth alongside stars:

```yaml
inputs:
  stars: true
  forks: true
  since: 7d
```

Claude could track repository adoption through fork count.

#### 2. Community Health

Forks indicate active forks and usage:

```yaml
inputs:
  forks: true
  issues:
    states: [open]
  discussions:
    categories: [Q&A]
  since: 30d
  min_items: 1
```

Claude could assess community engagement.

#### 3. Comparison Reports

Compare growth metrics:

```yaml
inputs:
  stars: true
  forks: true
  since: 30d
```

Claude could analyze growth trends in stars vs forks.

### Real-World Example

```yaml
---
name: Repository Growth Report
on:
  schedule:
    - cron: '0 10 * * 0'  # Sunday 10 AM
  workflow_dispatch: {}
permissions:
  discussions: write
outputs:
  create-discussion: true
inputs:
  stars: true
  forks: true
  commits:
    branches: [main]
    limit: 100
  since: 7d
  min_items: 1
---

Generate a growth report comparing:

1. **Stars**: Current count and trend
2. **Forks**: Current count and trend
3. **Commits**: Development activity
4. **Insights**: Growth patterns and health

Identify what drives growth and celebrate success!
```

## Combined Configuration

Use both metrics together:

```yaml
inputs:
  stars: true
  forks: true
```

### Real-World Example: Community Dashboard

```yaml
---
name: Community Health Dashboard
on:
  schedule:
    - cron: '0 10 * * *'  # 10 AM daily
  workflow_dispatch: {}
permissions:
  discussions: write
  issues: read
  pull_requests: read
outputs:
  create-discussion: true
inputs:
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

Create a comprehensive community health dashboard with:

1. **Growth Metrics**
   - Current stars
   - Current forks
   - Growth trends

2. **Activity**
   - Issues opened/closed
   - PRs merged
   - Commits
   - Discussions

3. **Health Assessment**
   - Community engagement level
   - Development velocity
   - Growth trajectory

4. **Insights**
   - Key achievements
   - Areas for improvement
   - Action items

Make it visual and informative!
```

## Understanding the Data

Stars and forks show the current total count at the time the agent runs:

```markdown
## ⭐ Stars: 1,234
## 🍴 Forks: 56
```

These are snapshot values. To track growth over time:
- Create regular reports and compare counts manually
- Use GitHub's Insights tab for historical graphs
- Have Claude mention the counts in discussions for historical reference

## Use in Analytics

### Growth Reporting

Track stars and forks in weekly/monthly reports:

```yaml
inputs:
  stars: true
  forks: true
  since: 7d
  min_items: 1
```

Claude can mention these metrics in reports.

### Milestone Detection

Create special posts for milestones:

```yaml
# Run frequently to catch milestones
inputs:
  stars: true
  since: last-run
```

Claude could congratulate community when reaching 500, 1000, 5000 stars, etc.

### Community Health Tracking

Use as part of overall community metrics:

```yaml
inputs:
  stars: true
  forks: true
  discussions:
    limit: 50
  issues:
    states: [open]
  since: 30d
  min_items: 1
```

Claude can correlate stars/forks with community activity.

## Comparison with GitHub Insights

The GitHub Insights UI provides:
- Historical star/fork graphs
- Network graph showing forks
- Contributor metrics
- Traffic analytics

This input provides:
- Current count for use in agents
- Integration with other data types
- Automated reporting capabilities
- Programmatic access

Use together for complete visibility.

## Best Practices

### Include in Regular Reports

```yaml
# Good - part of comprehensive reporting
inputs:
  stars: true
  forks: true
  issues:
    states: [all]
  pull_requests:
    states: [merged]
  since: 7d
  min_items: 1
```

### Lightweight Metrics

```yaml
# Good - stars/forks alone run very fast
inputs:
  stars: true
  forks: true
```

### Combine with Activity Data

```yaml
# Good - correlate metrics with activity
inputs:
  stars: true
  forks: true
  commits:
    branches: [main]
  since: 30d
  min_items: 1
```

## See Also

- [Overview](./): Main inputs documentation
- [Issues](./issues/): Track issues alongside community metrics
- [Pull Requests](./pull-requests/): Track PRs alongside growth
- [Discussions](./discussions/): Monitor community engagement
