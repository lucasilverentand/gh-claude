---
title: Reactions
description: Enable agents to add emoji reactions to issues, PRs, and comments
---

The `add-reaction` output allows your agent to add emoji reactions to issues, pull requests, and comments. Reactions provide a lightweight way to acknowledge content without adding comment noise.

## Basic Example

```yaml
name: Reaction Bot
on:
  issues:
    types: [opened]

outputs:
  add-reaction: true
```

## Available Outputs

### add-reaction

Add emoji reactions to issues, pull requests, or comments.

```yaml
outputs:
  add-reaction: true         # boolean — default: false
```

Available reaction types: `+1`, `-1`, `laugh`, `confused`, `heart`, `hooray`, `rocket`, `eyes`

## Permission Requirements

Adding reactions requires read permission for the target resource:

```yaml
permissions:
  issues: read              # For issue/PR reactions
  pull_requests: read       # For PR reactions
```

## How It Works

When an agent wants to add a reaction, it writes a JSON file to `/tmp/outputs/add-reaction.json` containing the content type (issue, pull request, or comment), the content ID or number, and the reaction type.

The JSON structure requires a `content_type` field (`"issue"`, `"pull_request"`, or `"comment"`), a `content_id` field with the issue/PR number or comment ID, and a `reaction` field with one of the supported emoji types.

For multiple reactions, the agent creates numbered files like `add-reaction-1.json`, `add-reaction-2.json`, and so on.

## Best Practices

Use reactions as acknowledgment rather than communication. A thumbs up or eyes emoji can indicate you've seen something without adding comment clutter. Save actual comments for substantive feedback.

Be consistent in how your agent uses reactions. For example, always use 👀 (eyes) when the agent is reviewing something, ✅ (+1) when approving, or 🚀 (rocket) when deploying.

Don't overuse reactions. Adding reactions to every issue or comment can dilute their meaning. Reserve them for meaningful acknowledgments or to replace what would otherwise be a "noted" or "looking into it" comment.

Consider combining reactions with actions. For instance, add a 👀 reaction when the agent starts processing an issue, then add a comment with findings when done.

## Examples

<details>
<summary>Example: Acknowledge new issues</summary>

```yaml
name: Issue Acknowledger
on:
  issues:
    types: [opened]

outputs:
  add-reaction: true
```

```markdown
When a new issue is opened, add a 👀 (eyes) reaction to indicate it has been seen
and is in the triage queue.

This provides immediate feedback to the issue author without adding a comment.
```

</details>

<details>
<summary>Example: React to PR review requests</summary>

```yaml
name: PR Review Ack
on:
  pull_request:
    types: [review_requested]

outputs:
  add-reaction: true
```

```markdown
When a review is requested on a PR, add a 👀 (eyes) reaction to the PR
to acknowledge that the review request has been seen.

This lets the author know their request is being processed without sending
a notification via comment.
```

</details>

<details>
<summary>Example: Mark deployment readiness</summary>

```yaml
name: Deploy Ready Marker
on:
  pull_request:
    types: [labeled]

outputs:
  add-reaction: true

context:
  check_runs:
    status: [success]
```

```markdown
When a PR is labeled "ready-to-deploy" and all checks have passed:

Add a 🚀 (rocket) reaction to the PR to indicate it's cleared for deployment.

This provides a visual indicator that the PR has been validated and is ready
for the deployment process.
```

</details>

<details>
<summary>Example: Acknowledge helpful comments</summary>

```yaml
name: Helpful Comment Reactor
on:
  issue_comment:
    types: [created]

outputs:
  add-reaction: true
```

```markdown
When a comment contains keywords indicating it solved the issue
(e.g., "this fixed it", "worked for me", "solved my problem"):

Add a 🎉 (hooray) reaction to that comment to highlight it as a solution.

This helps other users quickly find helpful solutions in long issue threads.
```

</details>
