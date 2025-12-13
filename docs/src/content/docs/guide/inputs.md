---
title: Inputs System
description: Collect and analyze repository data before agent execution
---

The inputs system enables agents to collect repository data before execution. This is essential for scheduled agents that create reports, summaries, or alerts based on repository activity.

## Overview

Inputs are configured in the agent frontmatter and trigger a data collection job that runs before the Claude agent:

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 50
  pull_requests:
    states: [merged]
    limit: 30
  since: last-run    # Time range for data collection
  min_items: 1       # Skip execution if below threshold
```

**Key Feature:** Agents with inputs will **automatically skip execution** if insufficient data is collected, preventing unnecessary API usage and costs.

## How It Works

The input collection process:

1. **Pre-Flight Validation**: Security checks run first (as always)
2. **Collect-Inputs Job**: Queries GitHub API for configured data
   - Calculates time filter based on `since` field
   - Fetches each configured input type (issues, PRs, commits, etc.)
   - Filters and formats data as markdown
   - Counts total items collected
3. **Threshold Check**: Compares total items against `min_items`
   - If below threshold: Sets `has-inputs=false`, skips Claude execution
   - If meets threshold: Sets `has-inputs=true`, passes data to Claude
4. **Claude Execution**: If threshold met, Claude receives formatted data
5. **Agent Analysis**: Claude analyzes collected data and performs configured outputs

## Input Types

### Issues

Collect issues from the repository:

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

**Configuration Options:**

- `states`: Filter by state (`open`, `closed`, `all`)
- `labels`: Only issues with these labels
- `exclude_labels`: Exclude issues with these labels
- `assignees`: Only issues assigned to these users
- `creators`: Only issues created by these users
- `mentions`: Only issues mentioning these users
- `milestones`: Only issues in these milestones
- `limit`: Maximum issues to fetch (default: 100, max: 1000)

**Formatted Output to Claude:**

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

### Pull Requests

Collect pull requests:

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

**Configuration Options:**

- `states`: Filter by state (`open`, `closed`, `merged`, `all`)
- `labels`: Only PRs with these labels
- `exclude_labels`: Exclude PRs with these labels
- `assignees`: Only PRs assigned to these users
- `creators`: Only PRs created by these users
- `reviewers`: Only PRs with these reviewers
- `base_branch`: Only PRs targeting this branch
- `head_branch`: Only PRs from this branch (supports wildcards)
- `limit`: Maximum PRs to fetch (default: 100, max: 1000)

**Formatted Output to Claude:**

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

### Discussions

Collect discussions (uses GitHub GraphQL API):

```yaml
inputs:
  discussions:
    categories: [Announcements, Q&A]
    answered: true
    unanswered: false
    labels: [important]
    limit: 20
```

**Configuration Options:**

- `categories`: Filter by category names
- `answered`: Only answered discussions (boolean)
- `unanswered`: Only unanswered discussions (boolean)
- `labels`: Only discussions with these labels
- `limit`: Maximum discussions to fetch (default: 100, max: 1000)

**Formatted Output to Claude:**

```markdown
## 💬 Discussions

### [#8] How to configure webhooks?
**Category:** Q&A | **Author:** @user | **Updated:** 2024-01-15T11:00:00Z
**Status:** Answered
**URL:** https://github.com/owner/repo/discussions/8

I'm trying to set up webhooks but getting errors...
---
```

### Commits

Collect commits from specified branches:

```yaml
inputs:
  commits:
    branches: [main, develop]
    authors: [username]
    exclude_authors: [bot]
    limit: 100
```

**Configuration Options:**

- `branches`: Branches to check (default: `["main", "master"]`)
- `authors`: Only commits by these authors
- `exclude_authors`: Exclude commits by these authors (e.g., bots)
- `limit`: Maximum commits per branch (default: 100, max: 1000)

**Formatted Output to Claude:**

```markdown
## 📝 Commits

- [`a1b2c3d`](https://github.com/owner/repo/commit/a1b2c3d) Add user authentication - @developer (2024-01-15T10:00:00Z)
- [`e4f5g6h`](https://github.com/owner/repo/commit/e4f5g6h) Fix validation bug - @developer (2024-01-15T09:30:00Z)
- [`i7j8k9l`](https://github.com/owner/repo/commit/i7j8k9l) Update dependencies - @maintainer (2024-01-14T16:00:00Z)
```

### Releases

Collect releases:

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 10
```

**Configuration Options:**

- `prerelease`: Include pre-releases (boolean, default: false)
- `draft`: Include draft releases (boolean, default: false)
- `limit`: Maximum releases to fetch (default: 20, max: 100)

**Formatted Output to Claude:**

```markdown
## 🚀 Releases

### v2.1.0 - Major Feature Release
**Author:** @maintainer | **Published:** 2024-01-15T08:00:00Z
**Type:** Release
**URL:** https://github.com/owner/repo/releases/tag/v2.1.0

## What's New
- Added user authentication
- Improved performance
- Bug fixes

## Breaking Changes
- Removed deprecated API endpoints
---
```

### Workflow Runs

Collect workflow execution data:

```yaml
inputs:
  workflow_runs:
    workflows: [test.yml, build.yml]
    status: [failure, success]
    branches: [main, develop]
    limit: 50
```

**Configuration Options:**

- `workflows`: Filter by workflow file names or IDs
- `status`: Filter by conclusion (`success`, `failure`, `cancelled`, `skipped`)
- `branches`: Only runs on these branches
- `limit`: Maximum runs to fetch (default: 50, max: 1000)

**Formatted Output to Claude:**

```markdown
## ⚙️ Workflow Runs

### CI Tests - Run #152
**Status:** failure | **Branch:** main | **Author:** @developer
**Created:** 2024-01-15T10:45:00Z
**URL:** https://github.com/owner/repo/actions/runs/12345

---

### Build - Run #89
**Status:** success | **Branch:** develop | **Author:** @developer
**Created:** 2024-01-15T10:30:00Z
**URL:** https://github.com/owner/repo/actions/runs/12344

---
```

### Stars

Track repository star count:

```yaml
inputs:
  stars: true
```

**Formatted Output to Claude:**

```markdown
## ⭐ Stars: 1,234
```

**Note:** Currently reports absolute count. Star growth tracking requires persistent storage (future enhancement).

### Forks

Track repository fork count:

```yaml
inputs:
  forks: true
```

**Formatted Output to Claude:**

```markdown
## 🍴 Forks: 56
```

## Time Filtering

The `since` field controls the time range for data collection:

```yaml
inputs:
  issues:
    states: [all]
  since: last-run    # Time filter applies to all input types
```

**Available Values:**

- `last-run` (default): Collect data since the last successful workflow run
  - Uses GitHub Actions API to find previous run timestamp
  - Falls back to 24 hours if no previous run found
  - Ideal for scheduled reports

- `1h`, `6h`, `12h`, `24h`: Last N hours
  - `1h`: Last hour (useful for high-frequency monitoring)
  - `6h`: Last 6 hours
  - `24h`: Last 24 hours (daily reports)

- `7d`, `30d`: Last N days
  - `7d`: Last 7 days (weekly reports)
  - `30d`: Last 30 days (monthly reports)

**How It Works:**

Time filtering in the workflow uses bash date commands with GNU/BSD compatibility:

```bash
# GNU date (Linux)
SINCE_DATE=$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)

# BSD date (macOS)
SINCE_DATE=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)
```

All queries use ISO 8601 timestamps: `2024-01-15T10:30:00Z`

## Minimum Items Threshold

The `min_items` field prevents agent execution when insufficient data is collected:

```yaml
inputs:
  issues:
    states: [open]
  pull_requests:
    states: [open]
  min_items: 5    # Skip if fewer than 5 total items
```

**How It Works:**

1. All configured input types are queried
2. Total items counted across all types
3. If `total_items < min_items`: Agent execution is skipped
4. If `total_items >= min_items`: Data is passed to Claude

**Use Cases:**

- **Daily Reports**: `min_items: 1` - Only generate report if there's activity
- **Weekly Summaries**: `min_items: 10` - Ensure meaningful data before summarizing
- **Alert Agents**: `min_items: 1` - Only alert if problems found
- **Digest Emails**: `min_items: 5` - Skip quiet periods

**Default:** `min_items: 1` (at least one item required)

## Complete Configuration Example

Here's a comprehensive example showing all input types:

```yaml
---
name: Weekly Repository Digest
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
  workflow_dispatch: {}
permissions:
  discussions: write
  issues: read
  pull_requests: read
  contents: read
outputs:
  create-discussion: true
inputs:
  issues:
    states: [open, closed]
    exclude_labels: [duplicate, invalid]
    limit: 100
  pull_requests:
    states: [merged, open]
    limit: 50
  discussions:
    categories: [Announcements]
    limit: 20
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate]
    limit: 200
  releases:
    prerelease: false
    draft: false
    limit: 10
  workflow_runs:
    status: [failure]
    limit: 30
  stars: true
  forks: true
  since: 7d        # Last 7 days
  min_items: 5     # Skip if fewer than 5 items
---

You are a weekly digest agent that creates engaging repository summaries.

Analyze the collected data and create a discussion post with:

1. **Highlights**: Key achievements and milestones
2. **Activity Summary**: Issues, PRs, commits by the numbers
3. **Releases**: New versions and features shipped
4. **Community**: New contributors and stars growth
5. **Issues**: Failed workflows and blockers that need attention

Make it informative, concise, and celebrate wins!
```

## Real-World Examples

### Daily Activity Report

Monitor daily activity and create discussion post:

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 50
  pull_requests:
    states: [all]
    limit: 50
  commits:
    branches: [main]
    limit: 100
  since: last-run
  min_items: 1
```

**Claude Receives:**

```markdown
GitHub Event: schedule
Repository: owner/repo

## 📋 Issues

### [#123] Bug in login flow
**State:** open | **Author:** @user | **Updated:** 2024-01-15T14:30:00Z
...

## 🔀 Pull Requests

### [#45] Fix authentication
**State:** open | **Author:** @dev | **Updated:** 2024-01-15T13:00:00Z
...

## 📝 Commits

- [`a1b2c3d`](url) Add validation - @dev (2024-01-15T12:00:00Z)
...

---

Analyze the collected data and create a daily activity report...
```

### Failure Monitoring

Alert on workflow failures and critical issues:

```yaml
inputs:
  workflow_runs:
    status: [failure]
    limit: 50
  issues:
    states: [open]
    labels: [bug, critical]
    limit: 100
  pull_requests:
    states: [open]
    labels: [blocked, needs-review]
    limit: 50
  since: last-run
  min_items: 1
```

**Claude Receives:**

```markdown
## ⚙️ Workflow Runs

### CI Tests - Run #152
**Status:** failure | **Branch:** main
...

## 📋 Issues

### [#99] Critical: Data loss on save
**State:** open | **Labels:** bug, critical
...

## 🔀 Pull Requests

### [#88] Performance improvements
**State:** open | **Labels:** blocked
...

---

Monitor for failures and create alerts for critical issues...
```

### Weekly Digest

Comprehensive weekly summary:

```yaml
inputs:
  issues:
    states: [all]
    limit: 200
  pull_requests:
    states: [all]
    limit: 200
  commits:
    branches: [main]
    limit: 500
  releases:
    prerelease: true
    limit: 20
  stars: true
  forks: true
  since: 7d
  min_items: 5
```

## Performance Considerations

### API Rate Limits

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests/hour
- **GraphQL queries**: Counted by complexity

The inputs system is optimized:
- Single API call per input type
- Pagination handled efficiently
- Filters applied server-side when possible

**Recommendations:**
- Use `limit` to control data volume
- Filter by labels/states to reduce results
- Consider rate limits when setting schedule frequency

### Execution Time

Data collection typically takes:
- **Issues/PRs**: 2-5 seconds per 100 items
- **Discussions**: 3-7 seconds (GraphQL)
- **Commits**: 2-4 seconds per branch
- **Workflow runs**: 2-5 seconds
- **Total**: Usually 10-30 seconds for typical configurations

### Data Volume

Consider data volume limits:
- **GitHub Output Variables**: Max 1 MB
- **Artifacts**: Max 500 MB per artifact
- **Claude Context**: Optimal < 50 KB

The system automatically truncates data to 100 KB for GitHub outputs but preserves full data in artifacts.

## Best Practices

### 1. Use Appropriate Time Ranges

Match `since` to your schedule:

```yaml
# Hourly monitoring
on:
  schedule:
    - cron: '0 * * * *'
inputs:
  since: 1h

# Daily reports
on:
  schedule:
    - cron: '0 9 * * *'
inputs:
  since: last-run  # or 24h

# Weekly digests
on:
  schedule:
    - cron: '0 10 * * 1'
inputs:
  since: 7d
```

### 2. Set Reasonable Limits

Balance completeness with performance:

```yaml
# Good - focused data
inputs:
  issues:
    states: [open]
    labels: [bug]
    limit: 50

# Avoid - too broad
inputs:
  issues:
    states: [all]
    limit: 1000  # May timeout or exceed limits
```

### 3. Use Filters Effectively

Reduce noise with filters:

```yaml
# Good - specific filtering
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]

# Avoid - no filtering
inputs:
  commits:
    limit: 500  # Includes bot commits
```

### 4. Set Appropriate Thresholds

Prevent unnecessary runs:

```yaml
# Alert agents - run on any issue
inputs:
  workflow_runs:
    status: [failure]
  min_items: 1

# Digest reports - require meaningful activity
inputs:
  issues:
    states: [all]
  pull_requests:
    states: [all]
  min_items: 10  # Skip quiet weeks
```

### 5. Combine Related Inputs

Group related data for comprehensive analysis:

```yaml
# Good - related data
inputs:
  issues:
    states: [open, closed]
  pull_requests:
    states: [merged]
  commits:
    branches: [main]

# This allows Claude to see the complete picture:
# - Issues opened/closed
# - PRs merged
# - Commits that fixed issues
```

## Troubleshooting

### No Data Collected

If inputs job shows `has-inputs=false`:

1. **Check time range**: Ensure `since` matches expected activity
2. **Verify filters**: Labels/states may be too restrictive
3. **Review min_items**: May be set too high
4. **Check repository activity**: May genuinely be quiet

### Data Truncation

If output is truncated:

1. **Reduce limit**: Lower `limit` values
2. **Add filters**: Use labels, states, authors
3. **Reduce time range**: Shorter `since` period

### API Rate Limits

If hitting rate limits:

1. **Increase schedule interval**: Run less frequently
2. **Reduce data collection**: Lower limits, add filters
3. **Stagger multiple agents**: Don't run all at same time

### Missing Data

If expected data doesn't appear:

1. **Verify time filter**: Data may be outside `since` range
2. **Check filters**: Labels/states may exclude it
3. **Review API response**: Check workflow logs for errors

## Next Steps

- See [How It Works](./how-it-works/) for workflow execution details
- Learn about [Outputs](./outputs/) to act on collected data
- Review examples:
  - [Daily Activity Report](../examples/daily-summary/)
  - [Failure Alerts](../examples/failure-alerts/)
  - [Weekly Digest](../examples/weekly-digest/)
