---
title: Comments
description: Enable agents to post comments on issues and pull requests
---

The `add-comment` output allows your agent to post comments on GitHub issues and pull requests. Comments are a natural way for agents to communicate findings, ask clarifying questions, or provide feedback on issues and pull requests they're analyzing.

## Basic Example

```yaml
name: Issue Responder
on:
  issues:
    types: [opened]

outputs:
  add-comment: true
```

## Configuration Options

```yaml
outputs:
  add-comment: true          # boolean | { max: number }
  # or with limit:
  add-comment:
    max: 3                   # number — default: unlimited
```

**add-comment** — Enable commenting on issues/PRs. Set to `true` for unlimited or use object form to set a limit.

**max** — Maximum comments per run. All comments are validated before any are posted (atomic).

## Best Practices

Always set a `max` value for your comment output. Without a limit, a poorly designed agent could potentially post unlimited comments, which would be disruptive to your repository. For most use cases, `max: 1` is appropriate since a single well-crafted comment is usually more valuable than multiple fragmented ones.

Keep your agent's comment instructions focused on quality over quantity. Rather than having your agent post multiple short comments about different concerns, guide it to consolidate observations into a single comprehensive response. This keeps issue threads clean and makes it easier for maintainers to digest the feedback.

When writing agent instructions, remind the agent to be constructive and provide context for its observations. A comment that says "use a different regex" is far less helpful than one that explains what the issue is and suggests a specific alternative.

Be mindful that comments are visible to anyone with repository access. Your agent instructions should guide the agent to avoid including sensitive information like internal URLs, API keys, or confidential project details in its comments.

## More Examples

<details>
<summary>Example: Code review agent with limited comments</summary>

```yaml
name: Code Review Assistant
on:
  pull_request:
    types: [opened, synchronize]

outputs:
  add-comment: { max: 3 }

permissions:
  pull_requests: read
  contents: read
```

This agent reviews pull requests and can post up to three comments per run. The permissions grant read access to both the PR metadata and the repository contents, allowing the agent to analyze the code changes.

</details>

<details>
<summary>Example: Welcoming new contributors</summary>

```yaml
name: Welcome Bot
on:
  issues:
    types: [opened]

outputs:
  add-comment: { max: 1 }
```

A simple agent that welcomes new contributors when they open their first issue. Limiting to one comment ensures the greeting is concise and doesn't overwhelm the issue thread.

</details>

<details>
<summary>Example: Triage agent that asks clarifying questions</summary>

```yaml
name: Issue Triage
on:
  issues:
    types: [opened, edited]

outputs:
  add-comment: { max: 1 }
  add-label: { max: 3 }

permissions:
  issues: write
```

This agent analyzes new issues and can both add labels and post a comment asking for more information if the issue is unclear. The `issues: write` permission is required for adding labels.

</details>
