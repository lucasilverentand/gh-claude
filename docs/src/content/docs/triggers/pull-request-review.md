---
title: PR Review Events
description: Respond to pull request review submissions
---

Trigger your agent when a pull request review is submitted, edited, or dismissed.

## Basic Configuration

```yaml
on:
  pull_request_review:
    types: [submitted]
```

## Available Event Types

- **`submitted`** - A review is submitted (approved, changes requested, or comment)
- **`edited`** - A review body is edited
- **`dismissed`** - A review is dismissed

## Common Use Cases

### Respond to Review Feedback

Automatically acknowledge or act on review submissions:

```yaml
---
name: Review Response Handler
on:
  pull_request_review:
    types: [submitted]
permissions:
  pull_requests: write
---

When a review is submitted:
1. Check the review state (approved, changes_requested, commented)
2. If changes requested:
   - Thank the reviewer
   - Add 'needs-work' label
   - Summarize requested changes
3. If approved:
   - Thank the reviewer
   - Check if all required approvals met
   - Add 'ready-to-merge' label if appropriate
```

### Address Reviewer Concerns

Help PR authors understand and address feedback:

```yaml
---
name: Review Feedback Helper
on:
  pull_request_review:
    types: [submitted]
permissions:
  pull_requests: write
---

When a review requesting changes is submitted:
1. Parse the review comments
2. Categorize feedback into:
   - Code style issues
   - Logic/bug concerns
   - Architecture suggestions
3. Create a summary comment with actionable items
4. Suggest specific code changes if appropriate
```

### Auto-Respond to Approvals

Celebrate approvals and track review progress:

```yaml
---
name: Approval Tracker
on:
  pull_request_review:
    types: [submitted]
permissions:
  pull_requests: write
---

When a review is approved:
1. Thank the reviewer
2. Count total approvals
3. If minimum approvals reached:
   - Add 'approved' label
   - Notify PR author
4. Update PR checklist status
```

### Handle Dismissed Reviews

Track when reviews are dismissed:

```yaml
---
name: Dismissed Review Handler
on:
  pull_request_review:
    types: [dismissed]
permissions:
  pull_requests: write
---

When a review is dismissed:
1. Log the dismissal reason
2. Check if approval threshold still met
3. Update labels accordingly
4. Notify relevant parties if needed
```

## Available Data

When your agent runs, it has access to:

- **Review state** - via `${{ github.event.review.state }}` (approved, changes_requested, commented, dismissed)
- **Review body** - via `${{ github.event.review.body }}`
- **Reviewer** - via `${{ github.event.review.user.login }}`
- **PR number** - via `${{ github.event.pull_request.number }}`
- **PR title** - via `${{ github.event.pull_request.title }}`

Access review details using the `gh` CLI:

```bash
# Get PR reviews
gh pr view ${{ github.event.pull_request.number }} --json reviews

# Get specific review details
gh api repos/{owner}/{repo}/pulls/${{ github.event.pull_request.number }}/reviews/${{ github.event.review.id }}

# Get review comments
gh api repos/{owner}/{repo}/pulls/${{ github.event.pull_request.number }}/reviews/${{ github.event.review.id }}/comments
```

## Review States

The review state indicates the type of review:

- **`approved`** - Reviewer approved the changes
- **`changes_requested`** - Reviewer requested changes
- **`commented`** - Reviewer left comments without approval/rejection
- **`dismissed`** - Review was dismissed (only for `dismissed` event type)

## Required Permissions

For read-only operations:

```yaml
permissions:
  pull_requests: read
```

For operations that modify PRs or respond to reviews:

```yaml
permissions:
  pull_requests: write
```

See [Permissions](../../guide/permissions/) for details.

## Best Practices

### Handle All Review States

Consider all possible review outcomes:

```yaml
on:
  pull_request_review:
    types: [submitted]
```

Then in your agent logic, check the state and respond appropriately.

### Be Gracious

When responding to reviews:
- Thank reviewers for their time
- Acknowledge valid concerns
- Be helpful, not defensive
- Focus on resolution

### Avoid Notification Spam

Use rate limiting for frequent reviewers:

```yaml
on:
  pull_request_review:
    types: [submitted]
rate_limit_minutes: 5
```

### Distinguish from PR Events

Remember that `pull_request_review` is different from `pull_request`:
- `pull_request` triggers on PR creation, updates, etc.
- `pull_request_review` triggers on review submissions

## Examples

### Review Summary Generator

```yaml
---
name: Review Summary
on:
  pull_request_review:
    types: [submitted]
permissions:
  pull_requests: write
---

When a review with changes_requested is submitted:
1. Parse all review comments
2. Group by file
3. Create a summary comment with:
   - Quick overview of concerns
   - File-by-file breakdown
   - Suggested priority order
```

### Approval Gate Checker

```yaml
---
name: Approval Gate
on:
  pull_request_review:
    types: [submitted, dismissed]
permissions:
  pull_requests: write
---

After any review activity:
1. Count current approvals
2. Check for blocking reviews (changes_requested)
3. Update labels:
   - 'approved' if threshold met and no blockers
   - 'changes-requested' if blockers exist
   - 'needs-review' if neither
```

## Next Steps

- Learn about [Pull Request triggers](pull-requests/)
- Understand [Pull Request Target](pull-request-target/) for fork PRs
- See [Permissions](../../guide/permissions/)
