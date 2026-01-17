---
title: Releases
description: Enable agents to create GitHub releases
---

The `create-release` output allows your agent to create GitHub releases with release notes, tags, and assets. This is useful for automating release processes, generating changelogs, and publishing versioned artifacts.

## Basic Example

```yaml
name: Release Manager
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

outputs:
  create-release: { max: 1 }
```

## Available Outputs

### create-release

Create GitHub releases with tags, release notes, and optional prerelease or draft status.

```yaml
outputs:
  create-release: true       # boolean | { max: number } — default: false
  # or with limit:
  create-release:
    max: 1                   # number — default: unlimited
```

**max** — Maximum releases to create per run.

## Permission Requirements

Creating releases requires the `contents: write` permission:

```yaml
permissions:
  contents: write
```

## How It Works

When an agent wants to create a release, it writes a JSON file to `/tmp/outputs/create-release.json` containing the tag name, release name, body (release notes), and optional flags for prerelease or draft status.

The JSON structure requires a `tag_name` field for the git tag and a `name` field for the release title. The `body` field contains the release notes in markdown format. Optional boolean fields `draft` and `prerelease` control the release visibility and status.

## Best Practices

Always set a `max` limit on `create-release` to prevent creating multiple releases accidentally. For most workflows, `max: 1` is appropriate since you typically want one release per trigger.

Use semantic versioning for release tags (e.g., v1.2.3) and ensure tags are created before attempting to create the release. The tag must exist in the repository before the release can be created.

Write comprehensive release notes that include what changed, any breaking changes, upgrade instructions, and attribution to contributors. Consider using conventional commit messages to automatically generate meaningful changelogs.

For repositories with automated releases, consider using draft releases first. This allows human review of the generated release notes before publishing to users.

Be mindful that releases are publicly visible by default. Ensure your agent doesn't include sensitive information like internal issue numbers, customer names, or security details in release notes.

## Examples

<details>
<summary>Example: Automated release from tag</summary>

```yaml
name: Auto Release
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

outputs:
  create-release: { max: 1 }

context:
  pull_requests:
    states: [merged]
  commits:
    branches: [main]
  since: last-release
```

```markdown
A new version tag has been pushed. Create a GitHub release with:

1. Tag name: Use the tag that triggered this workflow
2. Release name: Extract version from tag (e.g., "v1.2.3" → "Release 1.2.3")
3. Release notes: Generate a changelog including:
   - Summary of merged PRs since the last release
   - Commit messages grouped by type (features, fixes, chores)
   - List of contributors who made commits

Mark as prerelease if the version includes -alpha, -beta, or -rc.
```

</details>

<details>
<summary>Example: Weekly release notes draft</summary>

```yaml
name: Weekly Release Draft
on:
  schedule:
    - cron: '0 9 * * FRI'

permissions:
  contents: write

outputs:
  create-release: { max: 1 }

context:
  pull_requests:
    states: [merged]
    labels: [release-notes]
  since: 7d
  min_items: 1
```

```markdown
Create a draft release for the upcoming version:

1. Tag name: Use "v[next-version]" (increment patch version)
2. Release name: "Draft Release - Week of [date]"
3. Release notes: Summarize merged PRs labeled "release-notes" from the past week
4. Mark as draft so the team can review before publishing

Only create the draft if there was at least 1 PR merged this week.
```

</details>

<details>
<summary>Example: Hotfix release automation</summary>

```yaml
name: Hotfix Release
on:
  pull_request:
    types: [closed]
    branches: [main]
    labels: [hotfix]

permissions:
  contents: write

outputs:
  create-release: { max: 1 }
```

```markdown
When a hotfix PR is merged to main:

1. Create a new patch version tag (increment the patch number)
2. Create an immediate release (not a draft) with:
   - Tag name: The new patch version tag
   - Release name: "Hotfix [version]"
   - Release notes: PR title and description, emphasizing this is a critical fix
3. Label the release appropriately to indicate it's a hotfix

Only process PRs labeled "hotfix" that are merged to main.
```

</details>
