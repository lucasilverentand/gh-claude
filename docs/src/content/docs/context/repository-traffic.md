---
title: Repository Traffic
description: Collect repository traffic data including views, clones, and referrers
---

The `repository_traffic` context type collects traffic analytics for your repository, enabling agents to track growth, identify popular content, and understand how users discover your project.

## Basic Example

```yaml
name: Traffic Report
on:
  schedule:
    - cron: '0 9 * * MON'

context:
  repository_traffic:
    views: true
    clones: true
    referrers: true
    paths: true
```

## Configuration Options

```yaml
context:
  repository_traffic:
    views: true        # Collect view counts
    clones: true       # Collect clone counts
    referrers: true    # Collect top referrers
    paths: true        # Collect popular content paths
```

Note: GitHub provides traffic data for the last 14 days only.

## Collected Data

### Views
- Total views
- Unique visitors
- Daily breakdown

### Clones
- Total clones
- Unique cloners
- Daily breakdown

### Referrers
- Top referring sites
- View counts per referrer

### Paths
- Most viewed repository paths
- View counts per path

## Examples

<details>
<summary>Example: Weekly traffic report</summary>

```yaml
name: Weekly Traffic Report
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  repository_traffic:
    views: true
    clones: true
    referrers: true
    paths: true
```

```markdown
Generate a weekly traffic report:

1. Create an issue titled "Traffic Report - Week of [date]"
2. Include:
   - Total views and unique visitors
   - Total clones and unique cloners
   - Growth compared to previous week
   - Top 5 referring sites
   - Most viewed pages/files
   - Geographic insights (if available)
3. Highlight significant changes or trends
4. Add label: analytics

This helps track project growth and visibility.
```

</details>

<details>
<summary>Example: Growth milestone celebration</summary>

```yaml
name: Celebrate Growth
on:
  schedule:
    - cron: '0 12 * * *'

permissions:
  discussions: write

outputs:
  create-discussion: { max: 1 }

context:
  repository_traffic:
    views: true
    clones: true
  stars: true
```

```markdown
Celebrate repository growth milestones:

Check if we've reached significant milestones:
- Stars: 100, 500, 1000, 5000, 10000
- Weekly views: 1000, 5000, 10000
- Weekly clones: 100, 500, 1000

If a milestone is reached:
1. Create a discussion in "Announcements"
2. Title: "We've reached [N] [stars/views/clones]!"
3. Thank the community
4. Share project highlights
5. Invite continued engagement

Track milestones to avoid duplicate celebrations.
```

</details>

<details>
<summary>Example: Content optimization insights</summary>

```yaml
name: Content Insights
on:
  schedule:
    - cron: '0 9 1 * *'  # Monthly

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  repository_traffic:
    paths: true
    referrers: true
```

```markdown
Generate monthly content optimization insights:

1. Identify most viewed documentation pages
2. Identify least viewed but important pages
3. Analyze referrer sources (search, social, direct)
4. Create an issue with recommendations:
   - Enhance popular content with more details
   - Improve discoverability of underutilized content
   - Optimize for top referrer sources
   - Update outdated high-traffic pages
5. Add label: content-strategy

This helps improve documentation and project visibility.
```

</details>
