---
title: Branches
description: Collect repository branches with staleness detection
---

The `branches` context type collects information about repository branches, including staleness detection based on last commit date. This is useful for branch cleanup, monitoring active development, and identifying abandoned work.

## Basic Example

```yaml
name: Branch Monitor
on:
  schedule:
    - cron: '0 2 * * SUN'

context:
  branches:
    stale_days: 90
```

## Configuration Options

```yaml
context:
  branches:
    protected: false        # Include protected branches (default: false)
    stale_days: 90         # Consider branches stale after N days (optional)
    limit: 100             # Max branches to collect (default: 100)
```

## Collected Data

Each branch includes:
- Branch name
- Protected status
- Last commit SHA and message
- Last commit author
- Last commit date
- Days since last commit (if stale_days specified)
- Associated PRs (if any)

## Examples

<details>
<summary>Example: Stale branch cleanup</summary>

```yaml
name: Stale Branch Cleanup
on:
  schedule:
    - cron: '0 0 * * SUN'

permissions:
  contents: write
  pull_requests: read

outputs:
  delete-branch: true
  add-comment: { max: 1 }

context:
  branches:
    stale_days: 90
    protected: false
  pull_requests:
    states: [closed]
```

```markdown
Find and clean up stale branches:

For each branch that hasn't been updated in 90+ days:
1. Check if there's an associated PR
2. If PR is merged, delete the branch
3. If PR is closed (not merged), add a comment asking if the branch can be deleted
4. Never delete protected branches or branches named: main, master, develop, staging, production

Before deleting, verify the branch isn't the base or head of any open PR.
```

</details>

<details>
<summary>Example: Active development report</summary>

```yaml
name: Active Development Report
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  branches:
    protected: false
  since: 7d
```

```markdown
Generate a weekly active development report:

1. Create an issue titled "Active Development - Week of [date]"
2. List branches updated in the past 7 days
3. Group by:
   - Feature branches (feature/*)
   - Fix branches (fix/*, hotfix/*)
   - Other branches
4. Include commit count and last committer for each
5. Highlight branches without associated PRs

This gives visibility into ongoing work.
```

</details>

<details>
<summary>Example: Branch naming convention check</summary>

```yaml
name: Branch Convention Check
on:
  schedule:
    - cron: '0 8 * * *'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  branches:
    protected: false
  pull_requests:
    states: [open]
  since: 24h
```

```markdown
Check branch naming conventions for new branches:

Approved patterns:
- feature/* (new features)
- fix/* or hotfix/* (bug fixes)
- chore/* (maintenance)
- docs/* (documentation)

For branches created in the last 24 hours that don't match:
1. Create an issue listing non-conforming branches
2. Tag branch authors
3. Link to branch naming guidelines
4. Ask them to rename if the branch has an active PR

This encourages consistent naming across the team.
```

</details>
