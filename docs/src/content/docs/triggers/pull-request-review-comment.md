---
title: PR Review Comments
description: Respond to inline code review comments on pull requests
---

Trigger your agent when inline code review comments are added, edited, or deleted on pull request diffs.

## Basic Configuration

```yaml
on:
  pull_request_review_comment:
    types: [created]
```

## Available Event Types

- **`created`** - An inline review comment is added
- **`edited`** - An inline review comment is modified
- **`deleted`** - An inline review comment is removed

## Common Use Cases

### Code Question Answering

Respond to questions about specific code:

```yaml
---
name: Code Explainer
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
---

When a reviewer asks a question about a line of code:
1. Analyze the code in context
2. Explain what the code does
3. Clarify design decisions if applicable
```

### Inline Suggestions

Provide code suggestions in response to review comments:

```yaml
---
name: Code Suggester
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
  contents: read
---

When a reviewer requests a change:
1. Understand the requested change
2. Analyze the surrounding code
3. Suggest a specific code modification
```

### Review Thread Resolution

Help resolve review discussions:

```yaml
---
name: Thread Resolver
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
---

When a discussion thread is getting long:
1. Summarize the key points
2. Identify areas of agreement
3. Suggest a resolution path
```

## Multiple Event Types

Listen to multiple review comment events:

```yaml
on:
  pull_request_review_comment:
    types: [created, edited]
```

## Available Data

When your agent runs, it has access to:

- **Comment body** - via `${{ github.event.comment.body }}`
- **Comment author** - via `${{ github.event.comment.user.login }}`
- **Comment path** - via `${{ github.event.comment.path }}`
- **Comment line** - via `${{ github.event.comment.line }}`
- **Comment position** - via `${{ github.event.comment.position }}`
- **Diff hunk** - via `${{ github.event.comment.diff_hunk }}`
- **PR number** - via `${{ github.event.pull_request.number }}`

Access this data using the `gh` CLI:

```bash
# Get PR details
gh pr view ${{ github.event.pull_request.number }}

# Get PR diff
gh pr diff ${{ github.event.pull_request.number }}
```

## Difference from Issue Comments

| Feature | `issue_comment` | `pull_request_review_comment` |
|---------|-----------------|-------------------------------|
| Location | Conversation tab | Files changed tab |
| Context | Full issue/PR | Specific line of code |
| Use case | General discussion | Code-specific feedback |

## Required Permissions

For read-only operations:

```yaml
permissions:
  pull_requests: read
```

For operations that modify PRs or add comments:

```yaml
permissions:
  pull_requests: write
```

To also read the code context:

```yaml
permissions:
  pull_requests: write
  contents: read
```

See [Permissions](../../guide/permissions/) for details.

## Rate Limiting

Code reviews can generate many comments. Use rate limiting:

```yaml
on:
  pull_request_review_comment:
    types: [created]
rate_limit_minutes: 1  # Max once per minute
```

## Best Practices

### Understand the Context

Review comments are tied to specific lines of code. Always:
- Read the surrounding code
- Understand the full diff
- Consider the PR's purpose

### Be Concise

Inline responses should be focused:
- Answer the specific question
- Keep explanations brief
- Link to docs for longer explanations

### Respect Review Flow

Don't disrupt the human review process:
- Only respond when explicitly asked
- Don't auto-resolve threads
- Let humans make final decisions

## Examples

### Code Documentation Helper

```yaml
---
name: Doc Helper
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
  contents: read
---

When a reviewer asks "what does this do?":
1. Read the code being commented on
2. Analyze its purpose and behavior
3. Provide a clear explanation
4. Suggest adding a code comment if appropriate
```

### Suggestion Implementer

```yaml
---
name: Suggestion Bot
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
  contents: write
allowed-paths:
  - src/**
---

When a comment contains `/implement`:
1. Parse the suggested change
2. Apply the change to the file
3. Commit with a descriptive message
4. Reply confirming the change
```

### Review Summary

```yaml
---
name: Review Summarizer
on:
  pull_request_review_comment:
    types: [created]
permissions:
  pull_requests: write
---

When a comment contains `/summarize-thread`:
1. Collect all comments in this review thread
2. Identify the key points of discussion
3. Summarize agreements and disagreements
4. Suggest next steps
```

## Next Steps

- Learn about [Issue & PR Comments](issue-comment/)
- Learn about [Discussion Comments](discussion-comment/)
- Understand [Permissions](../../guide/permissions/)
