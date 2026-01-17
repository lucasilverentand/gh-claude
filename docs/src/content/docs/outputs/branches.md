---
title: Branches
description: Enable agents to create and delete repository branches
---

The branch outputs allow your agent to manage git branches programmatically. This is useful for automated maintenance tasks, branch cleanup, and workflow orchestration.

## Basic Example

```yaml
name: Branch Manager
on:
  schedule:
    - cron: '0 0 * * SUN'

permissions:
  contents: write

outputs:
  delete-branch: true
```

## Available Outputs

### create-branch

Create new branches from a specified ref (branch, tag, or commit SHA).

```yaml
outputs:
  create-branch: true        # boolean — default: false
```

### delete-branch

Delete branches that are no longer needed.

```yaml
outputs:
  delete-branch: true        # boolean — default: false
```

## Permission Requirements

Branch operations require the `contents: write` permission:

```yaml
permissions:
  contents: write
```

## How It Works

### Creating Branches

When an agent wants to create a branch, it writes a JSON file to `/tmp/outputs/create-branch.json` containing the new branch name and the source ref to branch from.

The JSON structure requires a `branch` field for the new branch name and a `ref` field specifying the source (branch name, tag, or commit SHA). If `ref` is omitted, the branch is created from the repository's default branch.

### Deleting Branches

When an agent wants to delete a branch, it writes a JSON file to `/tmp/outputs/delete-branch.json` containing the branch name to delete.

The JSON structure requires only a `branch` field with the name of the branch to delete. Protected branches cannot be deleted and will result in an error.

For multiple branch operations, the agent creates numbered files like `create-branch-1.json`, `delete-branch-1.json`, and so on.

## Best Practices

Never delete the default branch (main/master) or other protected branches. Implement safeguards in your agent instructions to prevent accidental deletion of important branches.

When creating branches, use descriptive naming conventions that indicate the purpose and optionally include dates or identifiers (e.g., `automation/cleanup-2024-01-15`, `bot/dependency-update-123`).

Before deleting branches, verify they have been merged or are truly abandoned. Consider checking for open PRs or recent commits before deletion.

Be cautious with automated branch cleanup. Missing a branch that's still in use can disrupt development workflows. When in doubt, preserve the branch.

Consider combining `delete-branch` with branch age checks from the `branches` context to only delete stale branches that haven't been updated in a specific timeframe.

## Examples

<details>
<summary>Example: Cleanup merged branches</summary>

```yaml
name: Branch Cleanup
on:
  schedule:
    - cron: '0 2 * * *'

permissions:
  contents: write
  pull_requests: read

outputs:
  delete-branch: true

context:
  pull_requests:
    states: [merged]
  since: 24h
```

```markdown
Find branches from PRs that were merged in the last 24 hours.

For each merged PR:
1. Check if the source branch still exists
2. Verify it's not a protected branch (main, master, develop, staging, production)
3. Delete the branch if it's safe to do so

Never delete:
- Protected branches
- Branches with open PRs
- The default branch
```

</details>

<details>
<summary>Example: Create automation branches</summary>

```yaml
name: Dependency Update Branches
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  contents: write

outputs:
  create-branch: true
  create-pr: { max: 1 }

context:
  releases:
    limit: 10
  since: 7d
```

```markdown
Check for new releases of our dependencies from the past week.

If there are critical updates available:

1. Create a branch named `deps/update-YYYY-MM-DD` from the main branch
2. Update the dependency versions in package.json
3. Create a PR from that branch with the changes

This automates the initial setup for dependency update PRs.
```

</details>

<details>
<summary>Example: Delete stale feature branches</summary>

```yaml
name: Stale Branch Cleanup
on:
  schedule:
    - cron: '0 0 * * SUN'

permissions:
  contents: write

outputs:
  delete-branch: true
  add-comment: { max: 1 }

context:
  branches:
    stale_days: 90
```

```markdown
Find branches that haven't had commits in 90+ days.

For each stale branch:
1. Check if there's an associated open PR
2. If there's an open PR, add a comment asking if the branch is still needed
3. If there's no open PR, delete the branch

Never delete protected branches or branches matching: main, master, develop, staging, production, release/*
```

</details>

<details>
<summary>Example: Create release branch</summary>

```yaml
name: Release Branch Creator
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., 1.2.0)'
        required: true
        type: string

permissions:
  contents: write

outputs:
  create-branch: true
```

```markdown
Create a new release branch for version {{ inputs.version }}:

1. Create branch named `release/v{{ inputs.version }}` from the main branch
2. The branch will be used for release preparation and hotfixes

This automates the creation of release branches following our versioning convention.
```

</details>
