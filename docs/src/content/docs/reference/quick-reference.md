---
title: Quick Reference
description: Quick lookup for gh-claude fields, patterns, and commands
---

Fast reference for all gh-claude configuration options, common patterns, and CLI commands.

## Frontmatter Fields

Quick lookup table of all available fields in agent frontmatter.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Agent display name |
| `on` | Yes | object | Trigger configuration |
| `permissions` | No | object | GitHub permissions |
| `outputs` | No | object | Allowed actions |
| `claude` | No | object | Claude model settings |
| `allowed-actors` | No | array | Allowed GitHub usernames |
| `allowed-users` | No | array | Alias for allowed-actors |
| `allowed-teams` | No | array | Allowed GitHub teams |
| `allowed-paths` | No | array | File path patterns (glob) |
| `trigger_labels` | No | array | Required labels to trigger |
| `rate_limit_minutes` | No | number | Min minutes between runs |
| `inputs` | No | object | Data collection config |
| `tools` | No | array | Custom tools (advanced) |

## Trigger Types

### Issues

```yaml
on:
  issues:
    types: [opened, edited, deleted, transferred, pinned, unpinned, closed, reopened, assigned, unassigned, labeled, unlabeled, locked, unlocked, milestoned, demilestoned]
```

**Common patterns:**
```yaml
# New issues only
on:
  issues:
    types: [opened]

# Label changes
on:
  issues:
    types: [labeled, unlabeled]

# State changes
on:
  issues:
    types: [opened, closed, reopened]
```

### Pull Requests

```yaml
on:
  pull_request:
    types: [opened, edited, closed, reopened, synchronize, converted_to_draft, ready_for_review, labeled, unlabeled, assigned, unassigned, review_requested, review_request_removed, auto_merge_enabled, auto_merge_disabled]
```

**Common patterns:**
```yaml
# New PRs
on:
  pull_request:
    types: [opened]

# PR updates (new commits)
on:
  pull_request:
    types: [opened, synchronize]

# PR merged
on:
  pull_request:
    types: [closed]
# Check in agent: if PR was merged
```

### Discussions

```yaml
on:
  discussion:
    types: [created, edited, deleted, transferred, pinned, unpinned, labeled, unlabeled, locked, unlocked, category_changed, answered, unanswered]
```

**Common patterns:**
```yaml
# New discussions
on:
  discussion:
    types: [created]

# Answered discussions
on:
  discussion:
    types: [answered]
```

### Schedule

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

**Common cron patterns:**
```yaml
# Every hour
- cron: '0 * * * *'

# Every 6 hours
- cron: '0 */6 * * *'

# Every day at 9am UTC
- cron: '0 9 * * *'

# Every Monday at 9am UTC
- cron: '0 9 * * MON'

# First day of month
- cron: '0 0 1 * *'

# Every weekday at 5pm UTC
- cron: '0 17 * * MON-FRI'
```

### Workflow Dispatch

```yaml
on:
  workflow_dispatch:
    inputs:
      inputName:
        description: 'Input description'
        required: true
        type: string
        default: 'default value'
```

**Input types:**
```yaml
# String input
stringInput:
  description: 'Text input'
  type: string
  default: 'value'

# Boolean checkbox
boolInput:
  description: 'Yes/No'
  type: boolean
  default: false

# Choice dropdown
choiceInput:
  description: 'Select option'
  type: choice
  options:
    - option1
    - option2
    - option3
  default: option1
```

### Repository Dispatch

```yaml
on:
  repository_dispatch:
    types: [custom-event, another-event]
```

## Permissions

| Permission | Values | Description |
|------------|--------|-------------|
| `contents` | read, write | Repository files |
| `issues` | read, write | Issues |
| `pull_requests` | read, write | Pull requests |
| `discussions` | read, write | Discussions |

**Common combinations:**
```yaml
# Read-only analysis
permissions:
  issues: read
  pull_requests: read

# Issue management
permissions:
  issues: write

# PR review
permissions:
  pull_requests: write

# Documentation updates
permissions:
  contents: write
  pull_requests: write

# Full access
permissions:
  contents: write
  issues: write
  pull_requests: write
  discussions: write
```

## Output Types

| Output | Description | Options |
|--------|-------------|---------|
| `add-comment` | Post comments | `max`, `sign` |
| `add-label` | Add labels | `max` |
| `remove-label` | Remove labels | `max` |
| `create-issue` | Create issues | `max` |
| `create-discussion` | Create discussions | `max` |
| `create-pr` | Create pull requests | `max`, `sign` |
| `update-file` | Modify files | `sign` |
| `close-issue` | Close issues | - |
| `close-pr` | Close pull requests | - |

**Output configuration:**
```yaml
# Simple enable
outputs:
  add-label: true

# With max limit
outputs:
  add-comment: { max: 1 }
  create-issue: { max: 5 }

# With signing
outputs:
  update-file: { sign: true }
  create-pr: { sign: true, max: 1 }
```

**Permission requirements:**

| Output | Required Permission |
|--------|-------------------|
| `add-comment` (issue) | `issues: write` |
| `add-comment` (PR) | `pull_requests: write` |
| `add-label` | `issues: write` or `pull_requests: write` |
| `remove-label` | `issues: write` or `pull_requests: write` |
| `create-issue` | `issues: write` |
| `create-discussion` | `discussions: write` |
| `create-pr` | `contents: write`, `pull_requests: write` |
| `update-file` | `contents: write` |
| `close-issue` | `issues: write` |
| `close-pr` | `pull_requests: write` |

**Additional requirements:**

- `create-pr` and `update-file` require `allowed-paths`
- All file operations require explicit path patterns

## Input Types

| Input Type | Fields | Description |
|------------|--------|-------------|
| `issues` | states, labels, exclude_labels, assignees, creators, mentions, milestones, limit | Collect issues |
| `pull_requests` | states, labels, exclude_labels, assignees, creators, reviewers, base_branch, head_branch, limit | Collect PRs |
| `discussions` | categories, answered, unanswered, labels, limit | Collect discussions |
| `commits` | branches, authors, exclude_authors, limit | Collect commits |
| `releases` | prerelease, draft, limit | Collect releases |
| `workflow_runs` | workflows, status, branches, limit | Collect workflow runs |
| `stars` | boolean | Include star count |
| `forks` | boolean | Include fork count |

**Common input patterns:**
```yaml
# Recent open issues
inputs:
  issues:
    states: [open]
    limit: 100
  since: last-run
  min_items: 1

# Failed workflows
inputs:
  workflow_runs:
    status: [failure]
    limit: 50
  since: 24h
  min_items: 1

# Merged PRs
inputs:
  pull_requests:
    states: [merged]
    limit: 50
  since: 7d

# Unanswered discussions
inputs:
  discussions:
    unanswered: true
    categories: [Q&A]
  since: last-run

# Recent commits
inputs:
  commits:
    branches: [main]
    limit: 50
  since: last-run
```

## Time Filters

Time filter options for the `since` field:

| Value | Description |
|-------|-------------|
| `last-run` | Since last successful workflow run (default) |
| `1h` | 1 hour ago |
| `6h` | 6 hours ago |
| `12h` | 12 hours ago |
| `24h` | 24 hours ago |
| `7d` | 7 days ago |
| `14d` | 14 days ago |
| `30d` | 30 days ago |
| `60d` | 60 days ago |
| `90d` | 90 days ago |

**Examples:**
```yaml
# Since last successful run
inputs:
  issues:
    states: [open]
  since: last-run

# Last 24 hours
inputs:
  pull_requests:
    states: [merged]
  since: 24h

# Last week
inputs:
  commits:
    branches: [main]
  since: 7d
```

## Claude Configuration

```yaml
claude:
  model: claude-3-5-sonnet-20241022
  max_tokens: 4096
  temperature: 0.7
```

**Available models:**
- `claude-3-5-sonnet-20241022` (recommended - balanced)
- `claude-3-opus-20240229` (most capable)
- `claude-3-haiku-20240307` (fastest, cheapest)

**Token limits:**
- Simple tasks: 1024-2048
- Standard tasks: 2048-4096
- Complex tasks: 4096-8192

**Temperature:**
- `0.0-0.3`: Focused, deterministic
- `0.4-0.7`: Balanced
- `0.8-1.0`: Creative, exploratory

## CLI Commands

```bash
# Initialize new project
gh claude init

# Validate agents
gh claude validate <file>              # Single file
gh claude validate --all               # All agents
gh claude validate --all --strict      # Strict validation

# Compile workflows
gh claude compile <file>               # Single file
gh claude compile --all                # All agents
gh claude compile --dry-run <file>     # Preview only

# List agents
gh claude list

# Setup authentication
gh claude setup-token
```

## Common Agent Patterns

### Issue Triage

```yaml
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

Categorize as bug/feature/docs/question.
Add priority label. Welcome contributor.
```

### PR Review

```yaml
---
name: PR Initial Review
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull_requests: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

Review changes. Check for tests.
Identify breaking changes. Add labels.
```

### Scheduled Summary

```yaml
---
name: Daily Summary
on:
  schedule:
    - cron: '0 9 * * *'
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
inputs:
  issues:
    states: [open, closed]
  pull_requests:
    states: [merged]
  since: 24h
---

Create daily activity summary.
```

### Manual Analysis

```yaml
---
name: Manual Analysis
on:
  workflow_dispatch:
    inputs:
      scope:
        description: 'Analysis scope'
        type: choice
        options: [quick, detailed, full]
permissions:
  issues: read
  pull_requests: read
outputs:
  add-comment: { max: 1 }
---

Analyze based on scope input.
```

### Documentation Updater

```yaml
---
name: Docs Updater
on:
  pull_request:
    types: [opened]
    paths:
      - 'docs/**'
permissions:
  contents: write
  pull_requests: write
allowed-paths:
  - docs/**
outputs:
  update-file: { sign: true }
  add-comment: { max: 1 }
---

Check links. Fix typos. Update examples.
```

### Stale Issue Manager

```yaml
---
name: Stale Issues
on:
  schedule:
    - cron: '0 10 * * MON'
permissions:
  issues: write
outputs:
  add-label: true
  add-comment: { max: 20 }
  close-issue: true
inputs:
  issues:
    states: [open]
    exclude_labels: [backlog, pinned]
  since: 60d
---

Mark stale. Warn. Close if no response.
```

## Decision Trees

### Choosing Triggers

```
Need automatic response to events?
├─ Yes → Use event triggers (issues, pull_request, discussion)
│   ├─ Specific events? → Add types filter
│   └─ Path-based? → Add paths filter
└─ No → Use schedule or workflow_dispatch
    ├─ Time-based? → schedule with cron
    └─ On-demand? → workflow_dispatch with inputs
```

### Choosing Outputs

```
What should agent do?
├─ Just analyze → No outputs (logs only)
├─ Provide feedback → add-comment
├─ Categorize → add-label / remove-label
├─ Create new items → create-issue / create-discussion / create-pr
├─ Modify files → update-file (requires allowed-paths)
└─ Close items → close-issue / close-pr
```

### Choosing Permissions

```
What does agent need to access?
├─ Read issues → issues: read
├─ Modify issues → issues: write
├─ Read PRs → pull_requests: read
├─ Modify PRs → pull_requests: write
├─ Read files → contents: read (default)
└─ Modify files → contents: write + allowed-paths
```

## Permission Requirements Matrix

| Action | Permission | Additional Requirements |
|--------|-----------|------------------------|
| Read issue | `issues: read` | - |
| Comment on issue | `issues: write` | `add-comment` output |
| Label issue | `issues: write` | `add-label` output |
| Close issue | `issues: write` | `close-issue` output |
| Create issue | `issues: write` | `create-issue` output |
| Read PR | `pull_requests: read` | - |
| Comment on PR | `pull_requests: write` | `add-comment` output |
| Label PR | `pull_requests: write` | `add-label` output |
| Close PR | `pull_requests: write` | `close-pr` output |
| Create PR | `contents: write`, `pull_requests: write` | `create-pr` output, `allowed-paths` |
| Read files | `contents: read` (default) | - |
| Modify files | `contents: write` | `update-file` output, `allowed-paths` |
| Read discussions | `discussions: read` | - |
| Create discussion | `discussions: write` | `create-discussion` output |

## Path Pattern Examples

```yaml
# Single file
allowed-paths:
  - README.md

# Directory and contents
allowed-paths:
  - docs/**

# File extension anywhere
allowed-paths:
  - "**/*.md"

# Multiple patterns
allowed-paths:
  - docs/**
  - "*.md"
  - examples/**

# Exclude patterns
allowed-paths:
  - docs/**
  - "!docs/archive/**"

# Specific file types in directory
allowed-paths:
  - "src/**/*.ts"
  - "!src/**/*.test.ts"
```

## Input Collection Limits

| Input Type | Default Limit | Max Recommended |
|------------|---------------|-----------------|
| `issues` | 100 | 1000 |
| `pull_requests` | 100 | 1000 |
| `discussions` | 100 | 1000 |
| `commits` | 100 | 1000 |
| `releases` | 20 | 100 |
| `workflow_runs` | 50 | 1000 |

**Setting limits:**
```yaml
inputs:
  issues:
    limit: 50  # Override default
  pull_requests:
    limit: 100
```

## Rate Limiting

```yaml
# No rate limit (default: 5 minutes)
rate_limit_minutes: 0

# Every 5 minutes max
rate_limit_minutes: 5

# Hourly max
rate_limit_minutes: 60

# Daily max
rate_limit_minutes: 1440
```

## Access Control

```yaml
# Specific users
allowed-actors:
  - alice
  - bob

# Team members
allowed-teams:
  - core-team
  - maintainers

# Combined (OR logic)
allowed-actors:
  - trusted-bot
allowed-teams:
  - admin-team
```

## Environment Variables

Available in GitHub Actions during agent execution:

```bash
# GitHub context
${{ github.repository }}      # owner/repo
${{ github.actor }}           # Triggering user
${{ github.event_name }}      # Event type
${{ github.workflow }}        # Workflow name

# Issue/PR context
${{ github.event.issue.number }}
${{ github.event.issue.title }}
${{ github.event.pull_request.number }}

# Workflow dispatch inputs
${{ inputs.inputName }}

# Secrets
${{ secrets.ANTHROPIC_API_KEY }}
${{ secrets.GITHUB_TOKEN }}
```

## Validation Checks

Quick checklist for agent validation:

- [ ] `name` is set
- [ ] At least one trigger in `on`
- [ ] Permissions match outputs (e.g., `issues: write` for `add-comment`)
- [ ] `allowed-paths` set if using `update-file` or `create-pr`
- [ ] Output limits set (e.g., `max: 1` for comments)
- [ ] Rate limiting configured appropriately
- [ ] Access control set if needed (allowed-actors/teams)
- [ ] Input collection has `min_items` to prevent empty runs
- [ ] Instructions are clear and specific

## Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Agent not triggering | Check trigger configuration and labels |
| Permission denied | Add required permission to `permissions` |
| Can't modify files | Add `allowed-paths` and `contents: write` |
| Rate limited | Increase `rate_limit_minutes` |
| No input data | Lower `min_items` or adjust `since` filter |
| Output not working | Verify output is in `outputs` config |
| User not authorized | Add to `allowed-actors` or `allowed-teams` |
| Workflow invalid | Run `gh claude validate --strict` |

## Next Steps

- Read [Advanced Topics](../../guide/advanced/) for complex patterns
- Review [Examples](../../examples/issue-triage/) for complete agents
- Check [Security](security/) for best practices
- Visit [Configuration](configuration/) for repository settings
