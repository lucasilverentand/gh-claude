---
title: Discussion Comments
description: Respond to comments on GitHub Discussions
---

Trigger your agent when comments are added, edited, or deleted on GitHub Discussions.

## Basic Configuration

```yaml
on:
  discussion_comment:
    types: [created]
```

## Available Event Types

- **`created`** - A comment is added to a discussion
- **`edited`** - A comment is modified
- **`deleted`** - A comment is removed

## Common Use Cases

### Continue Conversations

Respond to follow-up questions:

```yaml
---
name: Discussion Helper
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

When a new comment is added to a Q&A discussion:
1. Check if it's a follow-up question
2. Analyze the discussion context
3. Provide a helpful response
4. Suggest marking as answered if the question is resolved
```

### Answer Follow-ups

Handle questions that come after the initial post:

```yaml
---
name: Follow-up Handler
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

When someone adds a comment asking for clarification:
1. Read the original discussion
2. Understand what additional info is needed
3. Provide relevant details
4. Link to documentation if helpful
```

### Comment Moderation

Keep discussions on topic:

```yaml
---
name: Discussion Moderator
on:
  discussion_comment:
    types: [created, edited]
permissions:
  discussions: write
---

Review new comments for:
1. Off-topic content
2. Code of conduct violations
3. Spam or promotional content

If issues found, add a polite reminder about community guidelines.
```

### Knowledge Base Building

Track valuable answers:

```yaml
---
name: Knowledge Tracker
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

When a detailed answer is provided:
1. Assess if it would be valuable in documentation
2. If yes, add a label 'docs-candidate'
3. Summarize the key points for future reference
```

## Multiple Event Types

Listen to multiple comment events:

```yaml
on:
  discussion_comment:
    types: [created, edited]
```

## Available Data

When your agent runs, it has access to:

- **Comment body** - via `${{ github.event.comment.body }}`
- **Comment author** - via `${{ github.event.comment.user.login }}`
- **Comment ID** - via `${{ github.event.comment.node_id }}`
- **Discussion number** - via `${{ github.event.discussion.number }}`
- **Discussion title** - via `${{ github.event.discussion.title }}`
- **Discussion category** - via `${{ github.event.discussion.category.name }}`

Access discussion details using the GitHub API:

```bash
# Get discussion details via GraphQL
gh api graphql -f query='
  query {
    repository(owner: "${{ github.repository_owner }}", name: "${{ github.event.repository.name }}") {
      discussion(number: ${{ github.event.discussion.number }}) {
        title
        body
        comments(first: 100) {
          nodes {
            body
            author {
              login
            }
          }
        }
      }
    }
  }
'
```

## Difference from Discussion Events

| Feature | `discussion` | `discussion_comment` |
|---------|--------------|---------------------|
| Triggers on | Discussion itself | Comments on discussion |
| Use case | New discussions, category changes | Follow-up replies |
| Context | Initial question | Conversation thread |

## Required Permissions

For read-only operations:

```yaml
permissions:
  discussions: read
```

For operations that modify discussions or add comments:

```yaml
permissions:
  discussions: write
```

See [Permissions](../../guide/permissions/) for details.

## Rate Limiting

Active discussions can generate many comments. Use rate limiting:

```yaml
on:
  discussion_comment:
    types: [created]
rate_limit_minutes: 2  # Max once per 2 minutes
```

## Best Practices

### Be Community-Friendly

Discussions are community spaces:
- Use welcoming language
- Encourage participation
- Thank contributors

### Context is Key

Always read the full discussion thread before responding:
- Understand the original question
- Review previous answers
- Avoid repeating information

### Know When to Step Back

Not every comment needs a response:
- Let community members help each other
- Only intervene when necessary
- Focus on unanswered questions

### Respect the Category

Different categories have different purposes:
- **Q&A**: Focus on providing answers
- **Ideas**: Encourage discussion, don't shut down ideas
- **Show and tell**: Be encouraging and supportive
- **General**: Keep conversations flowing

## Examples

### Q&A Assistant

```yaml
---
name: Q&A Bot
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

In Q&A discussions:
1. Check if the comment contains a question
2. Search for answers in documentation
3. Provide a helpful response with links
4. Suggest marking as answered if the question is resolved
```

### Thread Summarizer

```yaml
---
name: Thread Summary
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

When a comment contains `/summarize`:
1. Read all comments in the discussion
2. Identify key points and decisions
3. Post a summary comment
4. Highlight any open questions
```

### Helpful Greeter

```yaml
---
name: Greeter Bot
on:
  discussion_comment:
    types: [created]
permissions:
  discussions: write
---

When a first-time commenter posts:
1. Welcome them to the community
2. Provide helpful resources
3. Encourage them to keep participating
```

## Next Steps

- Learn about [Discussion Events](discussions/)
- Learn about [Issue & PR Comments](issue-comment/)
- Understand [Permissions](../../guide/permissions/)
