---
title: Dependabot PRs
description: Collect automated dependency update pull requests
---

The `dependabot_prs` context type collects pull requests created by Dependabot for dependency updates, enabling agents to batch-merge updates, prioritize security patches, and manage dependency workflows.

## Basic Example

```yaml
name: Dependabot Manager
on:
  schedule:
    - cron: '0 10 * * *'

context:
  dependabot_prs:
    states: [open]
  since: 7d
```

## Configuration Options

```yaml
context:
  dependabot_prs:
    states: [open, closed, merged]  # Filter by PR state
    limit: 50                       # Max PRs to collect (default: 100)
```

## Collected Data

Each Dependabot PR includes:
- PR number, title, and state
- Dependency name and version change
- PR labels (dependencies, language/ecosystem)
- CI check status
- Review status
- Created and updated timestamps
- Merge status

## Examples

<details>
<summary>Example: Auto-merge minor updates</summary>

```yaml
name: Auto-merge Dependabot
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

permissions:
  pull_requests: write
  contents: write

outputs:
  approve-pr: true
  merge-pr: true
  add-comment: { max: 1 }

context:
  dependabot_prs:
    states: [open]
  check_runs:
    status: [success]
  since: 24h
```

```markdown
Auto-merge Dependabot PRs for minor and patch updates:

For each open Dependabot PR:
1. Check if it's a minor or patch version update (not major)
2. Verify all CI checks have passed
3. Verify the PR has no requested changes from reviewers
4. If all checks pass:
   - Approve the PR
   - Add a comment: "Auto-merging approved dependency update"
   - Merge using squash strategy

Skip major version updates - those require manual review.
```

</details>

<details>
<summary>Example: Batch dependency updates</summary>

```yaml
name: Batch Dependabot
on:
  schedule:
    - cron: '0 9 * * FRI'  # Friday mornings

permissions:
  pull_requests: write
  contents: write

outputs:
  create-pr: { max: 1 }
  close-pr: true

context:
  dependabot_prs:
    states: [open]
  check_runs:
    status: [success]
  since: 7d
  min_items: 5
```

```markdown
If there are 5+ open Dependabot PRs with passing checks:

1. Combine all dependency updates into a single branch
2. Create one consolidated PR titled "chore: batch dependency updates"
3. List all updated dependencies in the PR body
4. Close the individual Dependabot PRs with a comment linking to the batch PR

This reduces PR noise while keeping dependencies updated.
```

</details>

<details>
<summary>Example: Stale Dependabot cleanup</summary>

```yaml
name: Close Stale Dependabot
on:
  schedule:
    - cron: '0 2 * * SUN'

permissions:
  pull_requests: write

outputs:
  close-pr: true
  add-comment: { max: 1 }

context:
  dependabot_prs:
    states: [open]
```

```markdown
Find Dependabot PRs that are over 30 days old with failing checks:

For each stale PR with failures:
1. Add a comment: "Closing stale dependency update. A new PR will be created if the update is still needed."
2. Close the PR

This keeps the PR list clean. Dependabot will recreate PRs for still-needed updates.
```

</details>

<details>
<summary>Example: Security update prioritization</summary>

```yaml
name: Priority Security Updates
on:
  schedule:
    - cron: '0 9 * * *'

permissions:
  pull_requests: write

outputs:
  add-label: true
  add-comment: { max: 1 }

context:
  dependabot_prs:
    states: [open]
  security_alerts:
    state: [open]
```

```markdown
Cross-reference open Dependabot PRs with security alerts:

For each Dependabot PR that addresses a security vulnerability:
1. Add label "priority/high"
2. Add label "security"
3. Add a comment explaining which CVE is addressed and the severity
4. Mention the security team for urgent review

This ensures security-related dependency updates get fast-tracked.
```

</details>
