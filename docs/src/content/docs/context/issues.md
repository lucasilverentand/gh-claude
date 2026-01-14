---
title: Issues
description: Collect and filter repository issues for context
---

The issues context collector gathers issues from your repository and formats them as context for your agent. This is particularly useful for scheduled agents that need to analyze trends, generate reports, or triage incoming issues.

## Basic Example

```yaml
context:
  issues:
    states: [open]
    labels: [bug]
    limit: 50
  since: 24h
```

## Configuration Options

```yaml
context:
  issues:
    states: [open]           # string[] — default: all
    labels: [bug]            # string[]
    exclude_labels: [wontfix] # string[]
    limit: 50                # number — default: 100
```

**states** — Which issue states to include: `open`, `closed`, or `all`.

**labels** — Filter to issues with at least one of these labels. Case-sensitive.

**exclude_labels** — Exclude issues with any of these labels.

**limit** — Maximum issues to collect. Range: `1`-`1000`.

## Best Practices

Keep your limit reasonable for the frequency of your agent runs. A daily agent might work well with 50-100 issues, while a weekly summary agent could handle 200-500. Setting the limit too high can result in context that exceeds token limits or becomes difficult for the agent to process effectively.

Use label filtering strategically to focus your agent on relevant issues. Rather than collecting all issues and asking the agent to filter, specify the labels you care about upfront. This reduces noise and helps the agent focus on actionable items.

Combine `labels` and `exclude_labels` to create precise filters. For example, you might want all issues labeled `bug` except those already marked `investigating` or `blocked`. This pattern works better than trying to describe complex filtering logic in your agent's prompt.

Consider the `since` option at the context level to limit issues to those updated within a specific time window. Using `since: last-run` is particularly effective for scheduled agents, as it only collects issues that changed since the previous execution.

## More Examples

<details>
<summary>Example: Feature request triage agent</summary>

```yaml
---
name: Feature Request Triage
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
permissions:
  issues: write
outputs:
  add-label: true
  add-comment: true
context:
  issues:
    states: [open]
    labels: [enhancement, feature-request]
    exclude_labels: [triaged, wontfix, duplicate]
    limit: 50
  since: 7d
  min_items: 1
---

Review the untriaged feature requests and categorize them:

1. Add a priority label (priority-high, priority-medium, priority-low)
2. Add a component label if the affected area is clear
3. Add a brief comment explaining the triage decision

Focus on feasibility, user impact, and alignment with project goals.
```

</details>

<details>
<summary>Example: Bug report summary</summary>

```yaml
---
name: Daily Bug Summary
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM
permissions:
  discussions: write
outputs:
  create-discussion: true
context:
  issues:
    states: [open]
    labels: [bug]
    exclude_labels: [blocked, needs-reproduction]
    limit: 100
  since: last-run
  min_items: 1
---

Create a discussion post summarizing the current bug landscape:

- Group bugs by severity or component
- Highlight any critical issues that need immediate attention
- Note patterns or common themes across recent bug reports
- Keep the summary concise and actionable for the team
```

</details>

<details>
<summary>Example: Stale issue cleanup</summary>

```yaml
---
name: Stale Issue Review
on:
  schedule:
    - cron: '0 10 * * 0'  # Every Sunday at 10 AM
  workflow_dispatch: {}
permissions:
  issues: write
outputs:
  add-comment: true
  close-issue: true
context:
  issues:
    states: [open]
    exclude_labels: [pinned, keep-open]
    limit: 200
  since: 30d
---

Review open issues and identify those that appear stale or resolved.
For each stale issue, add a polite comment asking if it's still relevant.
Close issues that clearly describe problems that have been fixed or are
no longer applicable based on the codebase state.

Be conservative - when in doubt, leave the issue open and ask for clarification.
```

</details>

<details>
<summary>Example: Critical issue alerting</summary>

```yaml
---
name: Critical Issue Alert
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
permissions:
  issues: read
outputs:
  create-discussion: true
context:
  issues:
    states: [open]
    labels: [critical, security, urgent]
    limit: 20
  since: 1h
  min_items: 1
---

A critical issue has been opened or updated. Create an urgent discussion
post alerting the team with:

- Issue title and link
- Brief summary of the problem
- Suggested immediate actions
- Who might be best suited to investigate

Tag this discussion with the "urgent" category.
```

</details>
