---
title: Milestones
description: Collect repository milestones with progress tracking
---

The `milestones` context type collects milestone information from your repository, enabling agents to track progress, generate reports, and automate milestone management.

## Basic Example

```yaml
name: Milestone Monitor
on:
  schedule:
    - cron: '0 9 * * *'

context:
  milestones:
    states: [open]
    sort: due_on
```

## Configuration Options

```yaml
context:
  milestones:
    states: [open, closed, all]     # Filter by milestone state
    sort: due_on                    # Sort by: due_on, completeness
    limit: 50                       # Max milestones (default: 100)
```

## Collected Data

Each milestone includes:
- Milestone number and title
- State (open or closed)
- Description
- Due date
- Progress metrics:
  - Total issues
  - Open issues
  - Closed issues
  - Completion percentage
- Created and updated timestamps
- Creator

## Examples

<details>
<summary>Example: Milestone progress report</summary>

```yaml
name: Milestone Progress
on:
  schedule:
    - cron: '0 9 * * MON,FRI'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  milestones:
    states: [open]
    sort: due_on
  issues:
    states: [open, closed]
```

```markdown
Generate a milestone progress report twice weekly:

For each active milestone:
1. Calculate completion percentage
2. List issues completed since last report
3. List overdue issues
4. Estimate completion date based on velocity
5. Create a report issue with:
   - Overall progress by milestone
   - Milestones at risk of missing deadline
   - Velocity trends
   - Blockers or concerns

This keeps stakeholders informed on project progress.
```

</details>

<details>
<summary>Example: Overdue milestone alert</summary>

```yaml
name: Overdue Milestone Alert
on:
  schedule:
    - cron: '0 9 * * *'

permissions:
  issues: write

outputs:
  add-label: true
  add-comment: { max: 1 }

context:
  milestones:
    states: [open]
  issues:
    states: [open]
```

```markdown
Monitor for overdue milestones:

For each milestone past its due date with open issues:
1. Add label "milestone/overdue" to all open issues in that milestone
2. Add a comment to each issue:
   - Notify that the milestone is overdue
   - Ask for status update
   - Request re-estimation if needed
3. Create a summary issue listing all overdue milestones

This ensures overdue work gets visibility and attention.
```

</details>

<details>
<summary>Example: Near-completion milestone notification</summary>

```yaml
name: Milestone Completion Check
on:
  schedule:
    - cron: '0 18 * * *'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  milestones:
    states: [open]
    sort: completeness
  issues:
    states: [open]
```

```markdown
Notify when milestones are near completion:

For each milestone that is 90%+ complete:
1. Create an issue titled "Milestone [name] ready for release"
2. List remaining open issues
3. Verify all issues are truly necessary for this milestone
4. Suggest moving non-critical issues to next milestone
5. Add label: release-ready

This helps finalize releases and avoid scope creep.
```

</details>
