---
title: Discussions
description: Collect and filter repository discussions
---

The discussions context allows your agent to collect GitHub Discussions from your repository. This is particularly useful for monitoring community Q&A, tracking feature ideas, or summarizing announcements. The collection uses GitHub's GraphQL API and supports filtering by category, answered status, and labels.

## Basic Example

```yaml
context:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
  since: 24h
```

## Configuration Options

```yaml
context:
  discussions:
    categories: [Q&A]        # string[]
    answered: true           # boolean
    unanswered: true         # boolean
    labels: [help-wanted]    # string[]
    limit: 100               # number, default: 100
```

**categories** — Filter to specific discussion categories (case-sensitive).

**answered** — Only include discussions with an accepted answer.

**unanswered** — Only include discussions without an accepted answer.

**labels** — Filter to discussions with specific labels (case-sensitive).

**limit** — Maximum discussions to fetch (1-1000).

## Best Practices

When collecting discussions, prefer filtering by category over collecting everything. Q&A discussions have very different characteristics than announcements or ideas, and mixing them makes it harder for your agent to provide focused analysis.

Combine `unanswered: true` with specific categories when building agents that respond to community questions. This ensures your agent only sees discussions that actually need attention rather than those already resolved.

Use the `since` field at the context level to limit collection to recent discussions. This prevents your agent from repeatedly processing the same old discussions and keeps context sizes manageable.

Set appropriate limits based on your workflow frequency. Hourly agents might only need 20-30 discussions, while weekly summary agents could handle 100 or more.

## More Examples

<details>
<summary>Example: Collect all Q&A discussions needing answers</summary>

```yaml
context:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
  since: last-run
  min_items: 1
```

This configuration is ideal for a community support agent that identifies questions needing responses.

</details>

<details>
<summary>Example: Monitor multiple categories</summary>

```yaml
context:
  discussions:
    categories: [Announcements, Ideas]
    limit: 30
  since: 7d
```

Useful for generating weekly summaries that cover both project updates and community feature requests.

</details>

<details>
<summary>Example: Track resolved Q&A for documentation</summary>

```yaml
context:
  discussions:
    categories: [Q&A]
    answered: true
    limit: 100
  since: 30d
  min_items: 5
```

Collects answered questions that could inform documentation improvements or FAQ updates.

</details>

<details>
<summary>Example: Priority discussions with labels</summary>

```yaml
context:
  discussions:
    labels: [critical, urgent]
    limit: 25
  since: last-run
  min_items: 1
```

Focuses on discussions that have been flagged as high priority by maintainers.

</details>

<details>
<summary>Example: Full agent definition for Q&A monitoring</summary>

```yaml
---
name: Q&A Monitor
on:
  schedule:
    - cron: '0 10 * * *'
  workflow_dispatch: {}
permissions:
  discussions: read
outputs:
  add-comment: true
context:
  discussions:
    categories: [Q&A]
    unanswered: true
    limit: 50
  since: last-run
  min_items: 1
---

Monitor unanswered Q&A discussions and identify those waiting longest for a response. Group discussions by topic area and flag any that appear to be blocking users. For discussions waiting more than 3 days, add a comment thanking the author and asking for any additional context that might help.
```

</details>
