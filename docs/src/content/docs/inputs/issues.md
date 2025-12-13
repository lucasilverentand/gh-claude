---
title: Issues Input Type
description: Collect and filter repository issues
---

Collect issues from your repository with extensive filtering options.

## Configuration

```yaml
inputs:
  issues:
    states: [open, closed, all]
    labels: [bug, enhancement]
    exclude_labels: [wontfix]
    assignees: [username]
    creators: [username]
    mentions: [username]
    milestones: [v1.0, v2.0]
    limit: 100
```

## Configuration Options

- **`states`** (array): Filter by state
  - `open` - Open issues only
  - `closed` - Closed issues only
  - `all` - Both open and closed issues

- **`labels`** (array): Only issues with these labels (case-sensitive)
  - Can include multiple labels
  - Issues must have all specified labels

- **`exclude_labels`** (array): Exclude issues with these labels
  - Removes issues matching any of these labels
  - Useful for filtering out duplicates, invalid, etc.

- **`assignees`** (array): Only issues assigned to these users
  - Specify GitHub usernames

- **`creators`** (array): Only issues created by these users
  - Specify GitHub usernames

- **`mentions`** (array): Only issues mentioning these users
  - Useful for filtering @mentions

- **`milestones`** (array): Only issues in these milestones
  - Specify milestone titles

- **`limit`** (number): Maximum issues to fetch
  - Default: `100`
  - Maximum: `1000`

## Output Format

When Claude receives issues data, it's formatted like this:

```markdown
## 📋 Issues

### [#42] Fix authentication bug
**State:** open | **Author:** @user | **Updated:** 2024-01-15T10:30:00Z
**Labels:** bug, high-priority
**URL:** https://github.com/owner/repo/issues/42

Users are experiencing authentication failures when...
---

### [#41] Add dark mode
**State:** closed | **Author:** @contributor | **Updated:** 2024-01-14T15:20:00Z
**Labels:** enhancement, ui
**URL:** https://github.com/owner/repo/issues/41

It would be great to have dark mode support...
---
```

Each issue includes:
- Issue number and title
- Current state (open/closed)
- Author username
- Last update timestamp
- Associated labels
- Direct link to the issue
- Issue body/description

## Configuration Examples

### Open Bugs Only

Collect all open bugs:

```yaml
inputs:
  issues:
    states: [open]
    labels: [bug]
    limit: 50
```

### Recent Feature Requests

Collect open enhancement requests, excluding those marked as won't-fix:

```yaml
inputs:
  issues:
    states: [open]
    labels: [enhancement]
    exclude_labels: [wontfix]
    limit: 100
```

### Unassigned Issues

Collect issues that are unassigned (no assignees filter = all):

```yaml
inputs:
  issues:
    states: [open]
    limit: 50
```

### By Milestone

Collect all issues in specific release milestones:

```yaml
inputs:
  issues:
    states: [all]
    milestones: [v2.0, v3.0]
    limit: 100
```

### Team Activity

Collect issues assigned to or created by specific team members:

```yaml
inputs:
  issues:
    states: [open, closed]
    assignees: [alice, bob, charlie]
    creators: [alice, bob]
    limit: 100
```

### Exclude Duplicates and Invalid

Get actionable issues by excluding common categories:

```yaml
inputs:
  issues:
    states: [open]
    exclude_labels: [duplicate, invalid, wontfix]
    limit: 100
```

### High-Priority Issues

Collect critical issues from a specific team member:

```yaml
inputs:
  issues:
    states: [open]
    labels: [critical, bug]
    creators: [security-team]
    limit: 50
```

## Use Cases

### 1. Daily Bug Report

Track open bugs and generate daily summaries:

```yaml
inputs:
  issues:
    states: [open]
    labels: [bug]
    limit: 50
  since: last-run
  min_items: 1
```

Claude could then create a report of bugs reported in the last day.

### 2. Release Blocker Tracking

Monitor issues blocking a release:

```yaml
inputs:
  issues:
    states: [open]
    milestones: [v2.0]
    labels: [blocking]
    limit: 100
```

Claude could identify which blockers need attention and flag them for the team.

### 3. Community Management

Track community feedback and feature requests:

```yaml
inputs:
  issues:
    states: [open]
    labels: [enhancement, community-request]
    exclude_labels: [wontfix, duplicate]
    limit: 100
  since: 7d
  min_items: 1
```

Claude could summarize community requests for prioritization.

### 4. Issue Triage

Analyze unlabed or newly created issues:

```yaml
inputs:
  issues:
    states: [open]
    limit: 100
  since: 1h
  min_items: 1
```

Claude could help triage and label new issues automatically.

### 5. Team Workload

Monitor work assigned to specific team members:

```yaml
inputs:
  issues:
    states: [open]
    assignees: [alice, bob]
    limit: 100
```

Claude could help balance workload or identify overloaded team members.

## Real-World Example

A daily standup agent that collects recent bugs:

```yaml
---
name: Daily Bug Report
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
  workflow_dispatch: {}
permissions:
  issues: read
outputs:
  create-discussion: true
inputs:
  issues:
    states: [open]
    labels: [bug]
    exclude_labels: [investigation-paused]
    limit: 50
  since: last-run
  min_items: 1
---

Analyze the open bugs and create a discussion post with:

1. **Critical Bugs**: Issues labeled critical
2. **Recently Updated**: Bugs updated in the last day
3. **Long-Standing**: Bugs open for more than a week
4. **By Component**: Group bugs by affected area

Keep the report concise and actionable for the team.
```

## Performance Tips

### Optimize with Labels

Use labels to reduce the result set:

```yaml
# Better - focused on actionable items
inputs:
  issues:
    states: [open]
    labels: [bug]
    exclude_labels: [blocked, duplicate]
    limit: 50
```

### Exclude Noise

Filter out issues that won't be acted upon:

```yaml
inputs:
  issues:
    states: [open]
    exclude_labels: [wontfix, duplicate, invalid, needs-discussion]
    limit: 100
```

### Set Appropriate Limits

Balance completeness with performance:

```yaml
# For frequently-run agents (hourly/daily)
inputs:
  issues:
    limit: 50

# For less frequent agents (weekly)
inputs:
  issues:
    limit: 200
```

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Pull Requests](./pull-requests/): Similar filtering for PRs
- [Discussions](./discussions/): Collect discussion posts
