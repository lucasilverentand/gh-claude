---
title: Pull Request Target
description: Safely handle pull requests from forks
---

The `pull_request_target` trigger runs in the context of the **base repository** rather than the fork. This makes it safe to use with PRs from forks while still having access to repository secrets and write permissions.

## Basic Configuration

```yaml
on:
  pull_request_target:
    types: [opened]
```

## Key Difference from pull_request

| Aspect | `pull_request` | `pull_request_target` |
|--------|---------------|----------------------|
| **Runs from** | Head branch (fork) | Base branch (target repo) |
| **Secrets access** | No (for forks) | Yes |
| **Write permissions** | No (for forks) | Yes |
| **Code checked out** | Fork's code | Base repo's code |

## Available Event Types

Same as `pull_request`:

- **`opened`** - Pull request is created
- **`edited`** - Pull request title or body is modified
- **`closed`** - Pull request is closed
- **`reopened`** - Pull request is reopened
- **`synchronize`** - Pull request commits are updated
- **`assigned`** / **`unassigned`** - Assignment changes
- **`labeled`** / **`unlabeled`** - Label changes
- **`locked`** / **`unlocked`** - Conversation lock changes
- **`ready_for_review`** - Marked as ready for review
- **`review_requested`** / **`review_request_removed`** - Review request changes
- **`converted_to_draft`** - Converted to draft

## Branch Filtering

Filter which base branches trigger the workflow:

```yaml
on:
  pull_request_target:
    types: [opened]
    branches:
      - main
      - 'release/**'
```

Exclude specific branches:

```yaml
on:
  pull_request_target:
    types: [opened]
    branches-ignore:
      - 'dependabot/**'
      - 'renovate/**'
```

## Security Considerations

### Important: Code Execution Safety

Since `pull_request_target` has access to secrets and write permissions, you must be careful about what code you run:

1. **Never checkout and run fork code directly** - The workflow runs with elevated permissions
2. **Only analyze, don't execute** - Use the agent to analyze PR metadata and diffs, not to run fork code
3. **Limit permissions** - Only request the minimum permissions needed

### Safe Patterns

**Safe**: Labeling based on PR metadata:

```yaml
---
name: Fork PR Labeler
on:
  pull_request_target:
    types: [opened]
permissions:
  pull_requests: write
---

Label external contributions:
1. Check if PR is from a fork
2. Add 'external-contribution' label
3. Welcome the contributor
```

**Safe**: Commenting based on diff analysis:

```yaml
---
name: Fork PR Reviewer
on:
  pull_request_target:
    types: [opened, synchronize]
permissions:
  pull_requests: write
---

Review the PR diff:
1. Use `gh pr diff` to analyze changes
2. Check for common issues
3. Add a comment with feedback
```

### Unsafe Patterns to Avoid

**Unsafe**: Running code from the fork:

```yaml
# DON'T DO THIS
steps:
  - uses: actions/checkout@v4
    with:
      ref: ${{ github.event.pull_request.head.sha }}
  - run: npm install && npm test  # Running untrusted code!
```

## Common Use Cases

### Label External Contributions

Identify and tag PRs from forks:

```yaml
---
name: External Contribution Labeler
on:
  pull_request_target:
    types: [opened]
permissions:
  pull_requests: write
---

For PRs from forks:
1. Add 'external-contribution' label
2. Add 'needs-cla-check' label if applicable
3. Welcome the contributor
4. Point them to contributing guidelines
```

### First-Time Contributor Welcome

Welcome new external contributors:

```yaml
---
name: Fork Contributor Welcome
on:
  pull_request_target:
    types: [opened]
permissions:
  pull_requests: write
---

When a fork PR is opened:
1. Check if this is the user's first PR
2. If first-time contributor:
   - Add welcoming comment
   - Link to contributing guide
   - Explain the review process
3. Add 'first-contribution' label
```

### CLA Verification

Check Contributor License Agreement status:

```yaml
---
name: CLA Check
on:
  pull_request_target:
    types: [opened]
permissions:
  pull_requests: write
---

For external PRs:
1. Check if contributor has signed CLA
2. If not signed:
   - Add 'cla-required' label
   - Comment with signing instructions
3. If signed:
   - Add 'cla-signed' label
```

### Triage External PRs

Route external contributions for review:

```yaml
---
name: Fork PR Triage
on:
  pull_request_target:
    types: [opened]
    branches: [main]
permissions:
  pull_requests: write
---

Triage external PRs:
1. Analyze the PR title and description
2. Identify affected areas (frontend, backend, docs)
3. Add appropriate labels
4. Request review from relevant team
```

## Available Data

Same as `pull_request`, but remember you're running in the base repository context:

- **PR number** - via `${{ github.event.pull_request.number }}`
- **PR author** - via `${{ github.event.pull_request.user.login }}`
- **Is fork** - via `${{ github.event.pull_request.head.repo.fork }}`
- **Fork repo** - via `${{ github.event.pull_request.head.repo.full_name }}`

Determine if PR is from a fork:

```bash
# Check if PR is from a fork
if [ "${{ github.event.pull_request.head.repo.full_name }}" != "${{ github.repository }}" ]; then
  echo "This is a fork PR"
fi
```

## Required Permissions

```yaml
permissions:
  pull_requests: write
```

For reading code:

```yaml
permissions:
  pull_requests: write
  contents: read
```

## Best Practices

### Filter to Main Branches

Only trigger for PRs to protected branches:

```yaml
on:
  pull_request_target:
    types: [opened]
    branches: [main, develop]
```

### Keep Actions Minimal

Limit what the workflow does to reduce security surface:

```yaml
# Good: Only labeling and commenting
permissions:
  pull_requests: write

# Avoid: Requesting more permissions than needed
# permissions:
#   contents: write  # Only if absolutely necessary
```

### Rate Limit Fork PRs

Prevent abuse from rapid PR creation:

```yaml
on:
  pull_request_target:
    types: [opened, synchronize]
rate_limit_minutes: 10
```

## Examples

### Safe Diff Analyzer

```yaml
---
name: Fork PR Analyzer
on:
  pull_request_target:
    types: [opened, synchronize]
    branches: [main]
permissions:
  pull_requests: write
---

Safely analyze the fork PR:
1. Use `gh pr diff` to get changes (safe - doesn't execute code)
2. Check for:
   - Large file changes
   - Sensitive file modifications
   - License file changes
3. Add appropriate warning labels
4. Comment with analysis summary
```

### Community Contribution Handler

```yaml
---
name: Community PR Handler
on:
  pull_request_target:
    types: [opened]
    branches: [main]
permissions:
  pull_requests: write
---

For community contributions:
1. Thank the contributor
2. Check PR against contribution guidelines
3. Verify PR template is filled out
4. Add 'community' label
5. Tag maintainers for review
```

## Next Steps

- Learn about [Pull Request triggers](pull-requests/) for same-repo PRs
- Understand [PR Review Events](pull-request-review/)
- See [Permissions](../../guide/permissions/)
