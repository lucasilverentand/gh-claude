---
title: Comments
description: Collect comments from issues, PRs, and discussions
---

The `comments` context type collects comments from various sources across your repository, enabling agents to analyze conversations, extract insights, and respond to community feedback.

## Basic Example

```yaml
name: Comment Analyzer
on:
  schedule:
    - cron: '0 9 * * *'

context:
  comments:
    issue_comments: true
    pr_comments: true
  since: 24h
```

## Configuration Options

```yaml
context:
  comments:
    issue_comments: true           # Include issue comments
    pr_comments: true              # Include PR comments
    pr_review_comments: true       # Include PR review comments
    discussion_comments: true      # Include discussion comments
    limit: 100                     # Max comments to collect (default: 100)
```

## Collected Data

Each comment includes:
- Comment ID and body
- Author username
- Comment type (issue, PR, review, discussion)
- Parent issue/PR/discussion number
- Created and updated timestamps
- Reactions count

## Examples

<details>
<summary>Example: Community feedback analysis</summary>

```yaml
name: Feedback Analyzer
on:
  schedule:
    - cron: '0 18 * * FRI'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  comments:
    issue_comments: true
    discussion_comments: true
  since: 7d
```

```markdown
Analyze community feedback from the past week:

1. Identify recurring themes or feature requests
2. Count mentions of specific topics
3. Extract pain points mentioned by users
4. Create a summary issue titled "Community Feedback Summary - Week of [date]"
5. Include:
   - Top requested features
   - Common pain points
   - Notable user suggestions
   - Trends compared to previous weeks

Only create if there were 10+ comments this week.
```

</details>

<details>
<summary>Example: Unanswered questions detector</summary>

```yaml
name: Unanswered Questions
on:
  schedule:
    - cron: '0 9 * * *'

permissions:
  issues: write

outputs:
  add-label: true
  add-comment: { max: 1 }

context:
  comments:
    issue_comments: true
  issues:
    states: [open]
  since: 48h
```

```markdown
Find issues where users asked questions but received no response:

For each issue opened in the last 48 hours:
1. Check if the issue or comments contain questions (?, "how do I", "what is")
2. Check if there's a response from a maintainer
3. If no maintainer response:
   - Add label "needs-response"
   - Add a comment: "We've seen your question and will respond soon!"

This ensures users don't feel ignored.
```

</details>

<details>
<summary>Example: PR review activity tracking</summary>

```yaml
name: Review Activity Monitor
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  comments:
    pr_review_comments: true
  pull_requests:
    states: [open]
  since: 7d
```

```markdown
Track PR review activity from the past week:

1. Count review comments per reviewer
2. Identify PRs with most discussion
3. Find PRs with unresolved threads
4. Create a report issue with:
   - Top reviewers by comment count
   - PRs needing more review attention
   - Review coverage statistics

This helps identify review bottlenecks.
```

</details>
