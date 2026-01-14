---
title: Releases
description: Collect and filter repository releases for your agent
---

The releases context type collects published releases from your repository. This is useful for agents that need to announce new versions, generate changelogs, or monitor release activity over time.

## Basic Example

```yaml
context:
  releases:
    limit: 10
```

## Configuration Options

```yaml
context:
  releases:
    prerelease: true         # boolean — default: false
    draft: true              # boolean — default: false
    limit: 10                # number — default: 20
```

**prerelease** — Include pre-release versions.

**draft** — Include draft releases.

**limit** — Maximum releases to collect. Range: `1`-`100`.

## Best Practices

Keep the limit reasonable for your use case. If you only need to check for new releases since the last run, a small limit like 5 or 10 is sufficient. For comprehensive release history analysis, you might want a higher limit.

Consider whether you actually need pre-releases and drafts. For public announcements, you typically want only stable, published releases. For internal monitoring or testing notifications, including pre-releases makes sense.

Combine releases with a `since` filter to focus on recent activity. Using `since: last-run` ensures you only process new releases that appeared since your agent last ran, avoiding duplicate processing.

When creating release announcement agents, use `min_items: 1` to prevent the agent from running when no new releases exist. This saves API costs and avoids unnecessary workflow runs.

## More Examples

<details>
<summary>Example: Include pre-releases for testing notifications</summary>

```yaml
context:
  releases:
    prerelease: true
    draft: false
    limit: 10
  since: last-run
  min_items: 1
```

</details>

<details>
<summary>Example: Monitor draft releases awaiting publication</summary>

```yaml
context:
  releases:
    prerelease: false
    draft: true
    limit: 5
```

</details>

<details>
<summary>Example: Full agent for release announcements</summary>

```yaml
---
name: Release Announcer
on:
  schedule:
    - cron: '0 10 * * *'
  workflow_dispatch: {}
permissions:
  discussions: write
  contents: read
outputs:
  create-discussion: true
context:
  releases:
    prerelease: false
    draft: false
    limit: 5
  since: last-run
  min_items: 1
---

When new releases are published, create a discussion post announcing them.
Include the version number, release highlights, and a link to the full release notes.
Keep the tone celebratory and informative for the community.
```

</details>

<details>
<summary>Example: Collect all release types for internal tracking</summary>

```yaml
context:
  releases:
    prerelease: true
    draft: true
    limit: 20
  since: 7d
```

</details>
