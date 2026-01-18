# Stale Issue Manager Agent

Manages inactive issues by warning contributors and eventually closing stale items to keep the backlog clean.

## Overview

| Property | Value |
|----------|-------|
| **Trigger** | Schedule (weekly) |
| **Schedule** | Monday 9am UTC |
| **Permissions** | `issues: write` |
| **Rate Limit** | 60 minutes |
| **Model** | claude-sonnet-4-20250514 |

## Purpose

The Stale Issue Manager keeps the issue backlog manageable by:

- **Identifying** issues with no activity for extended periods
- **Warning** contributors before closing
- **Closing** truly abandoned issues
- **Preserving** important issues via labels
- **Reactivating** issues when activity resumes

## Trigger Configuration

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 9am UTC
  workflow_dispatch: {}
```

Runs weekly on Monday mornings to start the week with a clean backlog.

## Outputs

| Output | Max | Purpose |
|--------|-----|---------|
| `add-comment` | 20 | Warn about staleness, close notifications |
| `add-label` | unlimited | Add/remove stale labels |
| `remove-label` | unlimited | Remove stale when activity resumes |
| `close-issue` | unlimited | Close confirmed stale issues |

## Context Collection

```yaml
context:
  issues:
    states: [open]
    exclude_labels: [pinned, security, critical, in-progress, approved, long-term]
    limit: 100
  since: "7d"
  min_items: 1
```

Loads open issues excluding protected ones.

## Staleness Criteria

### Time Thresholds

| State | Days Inactive | Action |
|-------|---------------|--------|
| Active | 0-59 | No action |
| Warning | 60+ | Add `stale` label, comment |
| Close | 74+ (60 + 14) | Close issue |

### Activity Resets Timer

- New comment from anyone
- Issue edited
- Label changed
- Assignee changed
- Milestone changed

### Activity Does NOT Reset

- Bot comments
- Automated label changes
- Mention in other issues

## Protected Labels

Issues with these labels are **never** marked stale or closed:

| Label | Reason |
|-------|--------|
| `pinned` | Explicitly marked important |
| `security` | Security issues need tracking |
| `critical` | Critical priority items |
| `in-progress` | Actively being worked |
| `approved` | Approved for implementation |
| `long-term` | Intentionally kept open |
| `good-first-issue` | Community engagement |
| `help-wanted` | Seeking contributors |

## Stale Management Process

```
┌─────────────────────────────────────┐
│   Weekly run (Monday 9am)           │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  1. Load Open Issues                │
│  - Filter out protected labels      │
│  - Calculate last activity date     │
│  - Sort by staleness                │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  2. Check Existing Stale Issues     │
│  - Has stale label?                 │
│  - Any activity since warning?      │
│  - Past grace period?               │
└─────────────────────────────────────┘
                   │
          ┌───────┴───────────────────┐
          │                           │
          ▼                           ▼
   Activity resumed?           No activity?
          │                           │
          ▼                           ▼
   Remove stale label          Close issue
   Welcome back comment        Closure comment
                   │
                   ▼
┌─────────────────────────────────────┐
│  3. Check Newly Stale Issues        │
│  - 60+ days without activity        │
│  - No protected labels              │
│  - Not already marked stale         │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  4. Warn Newly Stale                │
│  - Add stale label                  │
│  - Comment with warning             │
│  - Explain how to keep open         │
└─────────────────────────────────────┘
```

## Comment Templates

### Warning Comment

```markdown
This issue has been automatically marked as **stale** because it has not had
any activity in the last 60 days.

**What happens next?**
- If no further activity occurs, this issue will be closed in 14 days
- Any comment or update will remove the stale label and reset the timer

**To keep this issue open:**
- Comment with an update on the status
- Add the `pinned` label if this is important long-term
- Add the `in-progress` label if you're actively working on it

If this issue is no longer relevant, you can close it yourself. We appreciate
your contributions to keeping our issue tracker organized!
```

### Closure Comment

```markdown
This issue has been automatically closed due to inactivity.

**Why was this closed?**
- No activity for 60+ days
- No response during the 14-day grace period

**Is this still relevant?**
If you believe this issue should be reopened:
1. Leave a comment explaining the current status
2. We'll be happy to reopen it for continued discussion

Thank you for your understanding in helping us maintain a focused issue tracker.
```

### Reactivation Comment

```markdown
This issue is no longer stale! The `stale` label has been removed due to
recent activity.

Thanks for the update - we'll continue tracking this issue.
```

## Agent Instructions

The full instructions for Claude should cover:

### Staleness Detection

1. **Calculate age** - Days since last activity
2. **Check protection** - Respect protected labels
3. **Verify state** - Is it already stale?
4. **Consider context** - Is there ongoing discussion?

### Warning Guidelines

1. **Be clear** - Explain what will happen
2. **Be helpful** - Show how to prevent closure
3. **Be respectful** - Acknowledge contributor effort
4. **Be transparent** - Link to policy if exists

### Closure Guidelines

1. **Confirm staleness** - Double-check criteria
2. **Explain clearly** - Why it's being closed
3. **Enable reopening** - Explain the process
4. **Be gracious** - Thank contributors

### Key Behaviors

- **Never close** protected issues
- **Always warn** before closing
- **Remove stale** immediately on activity
- **Be consistent** - same rules for everyone

## Edge Cases

### Maintained by Bot

If an issue has only bot activity:
- Bot comments don't count as activity
- Treat as no human activity

### Long Discussions

If an issue has extensive history:
- Still follow staleness rules
- Consider if it should have `long-term` label

### Related to Open PR

If an issue is linked to an open PR:
- Check PR activity
- Consider as active if PR is active

### Reporter Unavailable

If the issue reporter hasn't responded:
- Still follow the process
- Other community members can keep it alive

## Configuration Options

### Timing Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `stale_days` | 60 | Days until marked stale |
| `close_days` | 14 | Days after stale until closed |
| `exempt_labels` | [list] | Labels that prevent staleness |

### Behavior Options

| Option | Default | Description |
|--------|---------|-------------|
| `close_issues` | true | Actually close stale issues |
| `remove_stale_on_activity` | true | Auto-remove stale label |
| `warn_before_close` | true | Comment before closing |

## Inter-Agent Relationships

### Triggers Other Agents

None - this is a maintenance agent.

### Triggered By

| Source | Via |
|--------|-----|
| Schedule | Cron (Monday 9am UTC) |
| Human | workflow_dispatch |

### Coordination Notes

- Respects labels from [Issue Triage](./issue-triage.md) (critical, etc.)
- Respects labels from [Issue Implementer](./issue-implementer.md) (approved, in-progress)
- Works independently of other agents
- Closed issues may be reopened by humans

## Example Scenarios

### Scenario 1: New Stale Issue

**Issue State:**
- Opened: 75 days ago
- Last activity: 65 days ago
- Labels: `bug`, `area:frontend`

**Action:**
1. Add `stale` label
2. Comment with warning
3. 14-day countdown starts

### Scenario 2: Stale Issue with Activity

**Issue State:**
- Has `stale` label (added 7 days ago)
- New comment: 2 days ago

**Action:**
1. Remove `stale` label
2. Comment welcoming back
3. Timer reset

### Scenario 3: Stale Issue Past Grace Period

**Issue State:**
- Has `stale` label (added 16 days ago)
- No activity since warning

**Action:**
1. Close issue
2. Comment explaining closure
3. Note how to reopen

### Scenario 4: Protected Issue

**Issue State:**
- Opened: 120 days ago
- Last activity: 90 days ago
- Labels: `security`

**Action:**
- No action (protected by `security` label)

## Frontmatter Reference

```yaml
---
name: Stale Issue Manager
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday mornings
  workflow_dispatch: {}
permissions:
  issues: write
outputs:
  add-comment: { max: 20 }
  add-label: true
  remove-label: true
  close-issue: true
context:
  issues:
    states: [open]
    exclude_labels: [pinned, security, critical, in-progress, approved, long-term]
    limit: 100
  since: "7d"
  min_items: 1
rate_limit_minutes: 60
claude:
  model: claude-sonnet-4-20250514
  maxTokens: 4096
  temperature: 0.5
---
```

## Customization Options

### Adjust Timing

More lenient:
```
stale_days: 90
close_days: 30
```

More aggressive:
```
stale_days: 30
close_days: 7
```

### Add Protected Labels

Protect additional labels by adding to `exclude_labels`.

### Disable Auto-Close

Set `close-issue` output to `false` to only warn, never close.

## Metrics to Track

- Issues marked stale per run
- Issues closed per run
- Issues reactivated (stale removed)
- Protected issue count
- Backlog size over time
- Contributor response rate to stale warnings
