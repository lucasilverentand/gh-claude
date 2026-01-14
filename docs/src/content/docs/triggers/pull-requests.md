---
title: Pull Request Events
description: Respond to pull request activity
---

Pull request triggers activate your agent when PRs are created, updated, or modified in various ways. This is ideal for code review automation, labeling, and enforcing contribution guidelines.

## Basic Example

```yaml
---
name: PR Reviewer
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull_requests: write
---

Review this pull request and provide constructive feedback on the changes.
```

## Configuration Options

```yaml
on:
  pull_request:
    types: [opened, synchronize]  # string[] — default: [opened, synchronize, reopened]
```

**types** — Which PR events trigger the agent: `opened`, `synchronize`, `edited`, `closed`, `reopened`, `converted_to_draft`, `ready_for_review`, `labeled`, `unlabeled`, `assigned`, `unassigned`, `review_requested`, `review_request_removed`, `locked`, `unlocked`.

## Best Practices

When building PR review agents, combine `opened` and `synchronize` to catch both new PRs and updates. This ensures your agent reviews the latest code after each push. For computationally expensive analysis like security scanning or comprehensive code review, consider triggering only on `ready_for_review` to avoid wasting resources on draft PRs that are still being developed.

Use rate limiting to prevent excessive runs during active development. A setting of `rate_limit_minutes: 5` ensures your agent runs at most once every five minutes, even if commits are pushed rapidly.

When providing feedback, focus on significant issues rather than style nitpicks that could be handled by linters. Frame suggestions constructively and explain the reasoning behind recommendations. Your agent is there to help, not to block progress.

For PRs that modify many areas of the codebase, consider having your agent add labels based on changed paths. This helps route reviews to the right team members and makes it easier to filter the PR backlog.

## More Examples

<details>
<summary>Example: Auto-labeling by file path</summary>

```yaml
---
name: PR Auto-Labeler
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull_requests: write
outputs:
  add-label: true
---

Analyze the files changed in this PR and add appropriate labels:
- Add "frontend" if files in src/components/ or src/pages/ are modified
- Add "backend" if files in src/api/ or src/services/ are modified
- Add "docs" if files in docs/ are modified
- Add "tests" if test files are modified
```

</details>

<details>
<summary>Example: Breaking change detection</summary>

```yaml
---
name: Breaking Change Detector
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull_requests: write
outputs:
  add-label: true
  add-comment: true
---

Analyze this PR for breaking changes:
1. Check if any public API signatures have changed
2. Look for removed exports or renamed functions
3. Review database schema changes for backwards compatibility

If breaking changes are found:
- Add the "breaking-change" label
- Comment with a summary of what changed and suggested migration steps
```

</details>

<details>
<summary>Example: Ready for review handler</summary>

```yaml
---
name: Comprehensive Review
on:
  pull_request:
    types: [ready_for_review]
permissions:
  pull_requests: write
  contents: read
---

This PR has been marked as ready for review. Perform a comprehensive analysis:

1. Review the overall architecture and design decisions
2. Check for potential security issues
3. Verify test coverage for new functionality
4. Ensure documentation is updated where needed
5. Look for performance implications

Provide a detailed review comment summarizing your findings.
```

</details>

<details>
<summary>Example: PR size labeler with rate limiting</summary>

```yaml
---
name: PR Size Labeler
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull_requests: write
rate_limit_minutes: 10
outputs:
  add-label: true
  remove-label: true
---

Check the size of this PR and update size labels accordingly:
- "size/XS" for less than 10 lines changed
- "size/S" for less than 100 lines
- "size/M" for less than 500 lines
- "size/L" for less than 1000 lines
- "size/XL" for 1000 or more lines

Remove any existing size labels before adding the new one.
```

</details>
