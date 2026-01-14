---
title: Commits
description: Collect and filter commits from repository branches
---

The commits context type collects recent commits from your repository branches. This is useful for agents that need to analyze development activity, generate release notes, or summarize what changed since the last run.

## Basic Example

```yaml
context:
  commits:
    branches: [main]
    limit: 100
  since: 7d
```

## Configuration Options

```yaml
context:
  commits:
    branches: [main]         # string[] — default: [main, master]
    limit: 50                # number — default: 100
```

**branches** — Which branches to collect commits from.

**limit** — Maximum commits to collect per branch. Range: `1`-`1000`.

## Best Practices

Focus on the main integration branch when generating release notes or activity summaries. Collecting from too many branches can create noise and make it harder for the agent to identify the most important changes.

Set appropriate limits based on your use case. A daily digest might only need 50 commits, while a weekly summary could require 200 or more. Higher limits increase token usage and processing time.

Combine commits context with the `min_items` threshold to skip agent execution when there's nothing new. This prevents unnecessary workflow runs and saves on API costs.

Consider using the `since: last-run` setting for recurring workflows. This ensures you only process commits that haven't been seen before, which is ideal for changelog generators or digest bots.

## More Examples

<details>
<summary>Example: Weekly activity digest</summary>

```yaml
---
name: Weekly Activity Summary
on:
  schedule:
    - cron: '0 10 * * 1'
  workflow_dispatch: {}
permissions:
  contents: read
outputs:
  create-discussion: true
context:
  commits:
    branches: [main]
    limit: 200
  since: 7d
  min_items: 5
---

Analyze the commits and create a discussion post summarizing the week's development activity. Group changes by type (features, fixes, refactoring) and highlight significant contributions.
```

</details>

<details>
<summary>Example: Multiple branch monitoring</summary>

```yaml
context:
  commits:
    branches: [main, develop, staging]
    limit: 50
  since: 24h
  min_items: 1
```

This configuration monitors activity across your main integration branches. Each branch is queried separately, so you could potentially receive up to 150 commits (50 per branch) if all branches have that much activity.

</details>

<details>
<summary>Example: Release notes generation</summary>

```yaml
---
name: Generate Release Notes
on:
  workflow_dispatch: {}
permissions:
  contents: read
outputs:
  create-issue: true
context:
  commits:
    branches: [main]
    limit: 500
  since: 30d
  min_items: 10
---

Review the commits from the past month and draft release notes. Organize them into categories like New Features, Bug Fixes, and Improvements. Focus on user-facing changes and skip internal refactoring unless it affects performance or reliability.
```

</details>

<details>
<summary>Example: Minimal configuration</summary>

```yaml
context:
  commits: {}
  since: last-run
```

This uses all defaults: checks `main` and `master` branches, retrieves up to 100 commits per branch, and filters to commits since the last successful run. Suitable for most scheduled agents that just need to know what changed.

</details>
