---
title: Discussions Input Type
description: Collect and filter repository discussions
---

Collect GitHub Discussions from your repository with filtering options.

## Configuration

```yaml
inputs:
  discussions:
    categories: [Announcements, Q&A]
    answered: true
    unanswered: false
    labels: [important]
    limit: 20
```

## Configuration Options

- **`categories`** (array): Filter by discussion category names
  - Case-sensitive: use exact category names
  - Common categories: `Q&A`, `Announcements`, `Ideas`, `Show and tell`, `General`
  - Leave empty to include all categories

- **`answered`** (boolean): Include answered discussions
  - `true` - Include discussions that have an accepted answer
  - `false` - Exclude answered discussions
  - Omit to include both answered and unanswered

- **`unanswered`** (boolean): Include unanswered discussions
  - `true` - Include discussions without an accepted answer
  - `false` - Exclude unanswered discussions
  - Omit to include both answered and unanswered

- **`labels`** (array): Only discussions with these labels
  - Case-sensitive
  - Can include multiple labels

- **`limit`** (number): Maximum discussions to fetch
  - Default: `100`
  - Maximum: `1000`

## Output Format

When Claude receives discussions data, it's formatted like this:

```markdown
## 💬 Discussions

### [#8] How to configure webhooks?
**Category:** Q&A | **Author:** @user | **Updated:** 2024-01-15T11:00:00Z
**Status:** Answered
**URL:** https://github.com/owner/repo/discussions/8

I'm trying to set up webhooks but getting errors...
---
```

Each discussion includes:
- Discussion number and title
- Category it belongs to
- Author username
- Last update timestamp
- Status (Answered/Unanswered)
- Direct link to the discussion
- Discussion body excerpt

## Configuration Examples

### Unanswered Questions

Collect discussions that need responses:

```yaml
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
```

### By Category

Collect specific category discussions:

```yaml
inputs:
  discussions:
    categories: [Announcements, Ideas]
    limit: 20
```

### Answered in Q&A

Collect resolved Q&A discussions:

```yaml
inputs:
  discussions:
    categories: [Q&A]
    answered: true
    limit: 30
```

### Important Discussions

Collect discussions with specific labels:

```yaml
inputs:
  discussions:
    labels: [important, critical]
    limit: 25
```

### All Discussions

Collect from all categories without filtering:

```yaml
inputs:
  discussions:
    limit: 100
```

### Announcements Only

Monitor announcement posts:

```yaml
inputs:
  discussions:
    categories: [Announcements]
    limit: 10
```

## Use Cases

### 1. Unanswered Questions Queue

Monitor community questions needing responses:

```yaml
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
  since: last-run
  min_items: 1
```

Claude could identify common questions and draft responses or documentation.

### 2. Community Health Report

Track discussion activity and community engagement:

```yaml
inputs:
  discussions:
    limit: 100
  since: 7d
  min_items: 1
```

Claude could generate a weekly report on community engagement levels.

### 3. Ideas Review

Monitor and summarize feature ideas from the community:

```yaml
inputs:
  discussions:
    categories: [Ideas]
    limit: 30
  since: 7d
  min_items: 1
```

Claude could summarize popular ideas for the team to review.

### 4. Important Alerts

Monitor important discussions and announcements:

```yaml
inputs:
  discussions:
    labels: [critical, urgent]
    limit: 20
  since: last-run
  min_items: 1
```

Claude could alert the team about important discussions.

### 5. Documentation Gaps

Identify common unanswered questions for documentation improvements:

```yaml
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 100
  since: 30d
  min_items: 5
```

Claude could analyze questions and suggest documentation improvements.

## Real-World Example

A community Q&A monitor that tracks unanswered questions:

```yaml
---
name: Q&A Monitor
on:
  schedule:
    - cron: '0 10 * * *'  # 10 AM daily
  workflow_dispatch: {}
permissions:
  discussions: read
outputs:
  add-comment: true
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
  since: last-run
  min_items: 1
---

Monitor unanswered Q&A discussions and create a summary with:

1. **Waiting Longest**: Sort by days without response
2. **Common Topics**: Group by subject area
3. **Priority**: Identify issues that block users

Add a comment to discussions waiting longer than 3 days
thanking the asker and asking for clarification if needed.
```

## Performance Tips

### Filter by Category

Use categories to focus on specific topics:

```yaml
# Better - specific categories
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 30
```

### Use Status Filters

Filter by answered/unanswered status:

```yaml
# Only get discussions needing responses
inputs:
  discussions:
    unanswered: true
    limit: 50
```

### Combine Filters

Layer multiple filters for precision:

```yaml
inputs:
  discussions:
    categories: [Q&A]
    unanswered: true
    labels: [urgent]
    limit: 25
```

## Category Reference

Common GitHub Discussions categories:

- **Q&A**: Questions and answers from the community
- **Announcements**: Project announcements and updates
- **Ideas**: Feature requests and ideas
- **Show and tell**: Community showcases and projects
- **General**: General discussion and off-topic

Categories are customizable per repository.

## Category Names

Category names are case-sensitive and must match your repository's discussion categories exactly. To find your repository's categories, visit the Discussions tab and note the category names.

Custom categories are supported - just use the exact name as it appears in your repository.

## Common Configurations

### Moderation Queue

```yaml
discussions:
  limit: 50
  since: last-run
  min_items: 1
```

### Community Q&A

```yaml
discussions:
  categories: [Q&A]
  unanswered: true
  limit: 50
```

### Announcements

```yaml
discussions:
  categories: [Announcements]
  limit: 10
```

### Ideas Review

```yaml
discussions:
  categories: [Ideas]
  limit: 30
```

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Issues](./issues/): Similar input type for issues
- [Pull Requests](./pull-requests/): Similar input type for PRs
