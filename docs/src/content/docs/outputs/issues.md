---
title: Issues
description: Enable agents to create, edit, and manage GitHub issues
---

The issue outputs allow your agent to fully manage GitHub issues including creation, editing, assignment, state changes, and organization. These operations are useful for automating workflows like creating daily summaries, tracking incidents, triaging new issues, or cleaning up stale issues.

## Basic Example

```yaml
name: Issue Manager
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }
  close-issue: true
  assign-issue: true
  add-label: true
```

## Available Outputs

### create-issue

Create new issues with title, body, labels, and assignees.

```yaml
outputs:
  create-issue: true         # boolean | { max: number } — default: false
  # or with limit:
  create-issue:
    max: 5                   # number — default: unlimited
```

**max** — Maximum issues to create per run.

### close-issue

Close issues with optional state reason ("completed" or "not_planned").

```yaml
outputs:
  close-issue: true          # boolean — default: false
```

### reopen-issue

Reopen previously closed issues.

```yaml
outputs:
  reopen-issue: true         # boolean — default: false
```

### edit-issue

Edit issue properties including title, body, and state.

```yaml
outputs:
  edit-issue: true           # boolean — default: false
```

### assign-issue

Assign or unassign users to issues.

```yaml
outputs:
  assign-issue: true         # boolean — default: false
```

### pin-issue

Pin important issues to the repository.

```yaml
outputs:
  pin-issue: true            # boolean — default: false
```

### set-milestone

Set or change milestones on issues or PRs.

```yaml
outputs:
  set-milestone: true        # boolean — default: false
```

### lock-conversation

Lock issue or PR conversations to prevent further comments.

```yaml
outputs:
  lock-conversation: true    # boolean — default: false
```

### convert-to-discussion

Convert issues to discussions, optionally specifying a category.

```yaml
outputs:
  convert-to-discussion: true # boolean — default: false
```

## Best Practices

Always set a `max` limit on `create-issue` to prevent runaway issue creation. Even a limit of 1 provides important protection against misconfigured agents creating dozens of duplicate issues.

Before creating issues, instruct your agent to search for existing issues with similar titles or content. This helps avoid duplicates and keeps your issue tracker clean.

When closing issues, combine the `close-issue` output with `add-comment` so the agent can explain why the issue is being closed. This provides transparency to issue authors and other contributors.

Issue content is typically public, so remind your agent not to include sensitive information like internal URLs, credentials, or detailed system configurations in issue titles or bodies.

## More Examples

<details>
<summary>Example: Weekly summary issue</summary>

```yaml
name: Weekly Summary
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  issues:
    states: [closed]
  pull_requests:
    states: [merged]
  since: 7d
```

```markdown
Create a weekly summary issue with:
- Title: "Weekly Summary - [Date Range]"
- Count of issues closed by label category
- Count of PRs merged
- Notable changes or highlights

Only create the summary if there was activity in the past week.
```

</details>

<details>
<summary>Example: Stale issue cleanup</summary>

```yaml
name: Close Stale Issues
on:
  schedule:
    - cron: '0 2 * * *'

permissions:
  issues: write

outputs:
  close-issue: true
  add-comment: { max: 1 }

context:
  issues:
    states: [open]
    labels: [needs-info]
  since: 30d
```

```markdown
Find issues labeled "needs-info" that haven't been updated in 30 days.

For each stale issue:
1. Add a comment explaining the issue is being closed due to inactivity
2. Close the issue with state_reason "not_planned"

Do not close issues with priority/critical label or active milestones.
```

</details>

<details>
<summary>Example: Duplicate detection and cleanup</summary>

```yaml
name: Handle Duplicates
on:
  issues:
    types: [opened]

permissions:
  issues: write

outputs:
  close-issue: true
  add-comment: { max: 1 }

context:
  issues:
    states: [open]
  since: 30d
```

```markdown
When a new issue is opened, search for similar existing issues by comparing:
- Issue titles
- Error messages mentioned
- Components or features affected

If you find a clear duplicate:
1. Add a comment linking to the original issue
2. Close this issue as "not_planned" with an explanation

Only close if you're confident it's a duplicate. When in doubt, leave both open.
```

</details>

<details>
<summary>Example: CI failure tracking</summary>

```yaml
name: Track CI Failures
on:
  workflow_dispatch:
    inputs:
      workflow_name:
        description: Name of the failed workflow
        required: true
        type: string

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }
  add-comment: { max: 1 }

context:
  issues:
    states: [open]
    labels: [ci-failure]
  since: 24h
```

```markdown
Check if a CI failure issue already exists for today.

If no existing issue:
- Create one with title "CI Failed: [workflow_name]"
- Include the workflow run details
- Add labels: ci-failure, priority/high

If an issue already exists:
- Add a comment with the new failure details instead
```

</details>
