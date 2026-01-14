---
title: Issue Events
description: Respond to issue activity in your repository
---

The issues trigger activates your agent when issues are created, updated, labeled, or otherwise modified in your repository. This is one of the most commonly used triggers for building automation around issue triage, support workflows, and contributor engagement.

## Basic Example

```yaml
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
---

Analyze new issues and categorize them appropriately.
```

## Configuration Options

```yaml
on:
  issues:
    types: [opened, edited]  # string[] — default: all types
trigger_labels: [bug]        # string[] — optional
rate_limit_minutes: 5        # number — default: 5
allowed-users: [octocat]     # string[] — optional
allowed-teams: [maintainers] # string[] — optional
```

**types** — Which issue events trigger the agent: `opened`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `closed`, `reopened`, `assigned`, `unassigned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `milestoned`, `demilestoned`.

**trigger_labels** — Restricts the agent to only run when specific labels are present on the issue.

**rate_limit_minutes** — Prevents the agent from running too frequently on the same repository.

**allowed-users** — Restricts which users can trigger the agent (defaults to admins, write access, and org members).

**allowed-teams** — Restricts the agent to only be triggered by members of specific teams.

## Best Practices

Be selective with your event types. Listening to many events increases the chance of your agent running unnecessarily and consuming API credits. Start with a focused set of events like `opened` for new issue triage, then expand if needed.

Use label filtering to create targeted workflows. Rather than having one agent process all issues, create specialized agents that respond to specific labels like `bug`, `feature-request`, or `needs-help`. This makes each agent simpler and more focused.

Account for rapid edits. Users often submit an issue and immediately edit it to fix formatting. Combine the `edited` event type with a reasonable `rate_limit_minutes` value to avoid processing intermediate states.

Consider idempotent operations when designing your agent instructions. Since users can add and remove labels, reopen closed issues, or trigger the same event multiple times, your agent should handle being run repeatedly on the same issue gracefully.

## More Examples

<details>
<summary>Example: Welcome First-Time Contributors</summary>

```yaml
---
name: Welcome Bot
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
---

Check if this is the user's first issue in the repository.
If so, welcome them warmly and provide helpful links to:
- Contributing guidelines
- Code of conduct
- How to get help

If they are a returning contributor, thank them for the continued engagement.
```

</details>

<details>
<summary>Example: Issue Template Validator</summary>

```yaml
---
name: Template Validator
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---

Check if the issue follows the template:
1. Verify required sections are present (Description, Steps to Reproduce, Expected Behavior)
2. If missing sections, add a polite comment requesting the missing information
3. Add 'needs-more-info' label if the issue is incomplete
```

</details>

<details>
<summary>Example: Label-Based Bug Investigation</summary>

```yaml
---
name: Bug Investigation
on:
  issues:
    types: [labeled]
trigger_labels: [bug, needs-investigation]
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---

When a bug is reported:
1. Check for reproduction steps in the issue body
2. If reproduction steps are missing, request them
3. Look for similar issues that might be duplicates
4. Add priority label based on the severity described
```

</details>

<details>
<summary>Example: Auto-Assignment by Content</summary>

```yaml
---
name: Issue Router
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---

Route issues to the right area based on content analysis:
1. Analyze the issue title and body for keywords
2. Determine the relevant area (frontend, backend, documentation, infrastructure)
3. Add the appropriate area label
4. If the issue mentions specific files or components, note which team member typically works on that area
```

</details>
