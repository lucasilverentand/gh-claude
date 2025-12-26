---
title: Issue & PR Comments
description: Respond to comments on issues and pull requests
---

Trigger your agent when comments are added, edited, or deleted on issues and pull requests.

## Basic Configuration

```yaml
on:
  issue_comment:
    types: [created]
```

## Available Event Types

- **`created`** - A comment is added
- **`edited`** - A comment is modified
- **`deleted`** - A comment is removed

## Common Use Cases

### IssueOps Commands

Implement slash commands for repository automation:

```yaml
---
name: IssueOps Handler
on:
  issue_comment:
    types: [created]
permissions:
  issues: write
  pull_requests: write
---

When a comment starts with `/claude`:
1. Parse the command after `/claude`
2. Execute the requested action
3. Reply with the result

Available commands:
- `/claude help` - Show available commands
- `/claude summarize` - Summarize the issue discussion
- `/claude assign @user` - Assign the issue to a user
```

### Question Answering

Respond to questions in comments:

```yaml
---
name: Comment Q&A
on:
  issue_comment:
    types: [created]
permissions:
  issues: write
---

When someone asks a question in a comment:
1. Analyze the question context
2. Check documentation and existing answers
3. Provide a helpful response
```

### Comment Moderation

Automatically moderate comments:

```yaml
---
name: Comment Moderator
on:
  issue_comment:
    types: [created, edited]
permissions:
  issues: write
---

Check comments for:
1. Code of conduct violations
2. Spam content
3. Off-topic discussions

If violations found:
- Add a warning comment
- Label for review
```

### Request More Information

When users provide incomplete details:

```yaml
---
name: Info Request Bot
on:
  issue_comment:
    types: [created]
permissions:
  issues: write
---

When a comment is added to an issue with 'needs-info' label:
1. Check if the comment provides requested information
2. If yes, remove the 'needs-info' label
3. If no, politely ask for the specific missing details
```

## Multiple Event Types

Listen to multiple comment events:

```yaml
on:
  issue_comment:
    types: [created, edited]
```

## Available Data

When your agent runs, it has access to:

- **Comment body** - via `${{ github.event.comment.body }}`
- **Comment author** - via `${{ github.event.comment.user.login }}`
- **Comment ID** - via `${{ github.event.comment.id }}`
- **Issue number** - via `${{ github.event.issue.number }}`
- **Issue title** - via `${{ github.event.issue.title }}`
- **Issue state** - via `${{ github.event.issue.state }}`

Access this data using the `gh` CLI:

```bash
# Get issue details
gh issue view ${{ github.event.issue.number }}

# Get all comments on the issue
gh issue view ${{ github.event.issue.number }} --comments
```

## Important Notes

### Issue Comments vs PR Comments

The `issue_comment` event fires for comments on **both issues and pull requests**. This is because GitHub treats PR conversations as issue comments internally.

To distinguish between them:

```yaml
---
name: Smart Comment Handler
on:
  issue_comment:
    types: [created]
---

Check if this is a pull request comment:
- If `github.event.issue.pull_request` exists, this is a PR comment
- Otherwise, this is a regular issue comment

Handle accordingly.
```

### Not for Review Comments

The `issue_comment` trigger is for **conversation comments** only, not for inline code review comments. For those, use the [Pull Request Review Comment](pull-request-review-comment/) trigger.

## Required Permissions

For read-only operations:

```yaml
permissions:
  issues: read
```

For operations that modify issues or add comments:

```yaml
permissions:
  issues: write
```

If operating on pull requests:

```yaml
permissions:
  issues: write
  pull_requests: write
```

See [Permissions](../../guide/permissions/) for details.

## Rate Limiting

Comments can be added rapidly. Use rate limiting to prevent excessive runs:

```yaml
on:
  issue_comment:
    types: [created]
rate_limit_minutes: 2  # Max once per 2 minutes per issue
```

## Best Practices

### Filter by Command Prefix

To prevent your agent from responding to every comment, use a command prefix:

```yaml
---
name: Claude Bot
on:
  issue_comment:
    types: [created]
---

Only respond if the comment starts with `/claude` or mentions @claude-bot.
Ignore all other comments.
```

### Avoid Infinite Loops

Be careful not to create loops where the agent responds to its own comments:

```yaml
---
name: Safe Responder
on:
  issue_comment:
    types: [created]
---

First, check if the comment was made by a bot (author ends with [bot]).
If so, ignore this comment.

Then proceed with handling.
```

### Be Responsive But Not Annoying

- Use clear command prefixes
- Don't reply to every comment
- Provide helpful, actionable responses
- Allow users to opt-out

## Examples

### Slash Command Bot

```yaml
---
name: Slash Commands
on:
  issue_comment:
    types: [created]
permissions:
  issues: write
  pull_requests: write
---

Parse comments for slash commands:

- `/help` - List available commands
- `/assign me` - Self-assign the issue
- `/label bug` - Add the bug label
- `/close` - Close the issue with a comment
- `/reopen` - Reopen the issue

Only respond to commands from users with write access.
```

### Context-Aware Helper

```yaml
---
name: Context Helper
on:
  issue_comment:
    types: [created]
permissions:
  issues: write
---

When asked questions about this issue:
1. Read the full issue history
2. Understand the context
3. Provide relevant information from docs or codebase
4. Suggest next steps if appropriate
```

## Next Steps

- Learn about [PR Review Comments](pull-request-review-comment/)
- Learn about [Discussion Comments](discussion-comment/)
- Understand [Permissions](../../guide/permissions/)
