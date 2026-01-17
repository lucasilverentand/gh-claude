---
title: Check Runs
description: Collect check run results from GitHub workflows
---

The `check_runs` context type collects detailed results from GitHub Actions check runs, enabling agents to analyze CI/CD pipeline health, track flaky tests, and automate failure responses.

## Basic Example

```yaml
name: CI Health Monitor
on:
  schedule:
    - cron: '0 9 * * *'

context:
  check_runs:
    workflows: [CI, Tests]
    status: [failure]
  since: 24h
```

## Configuration Options

```yaml
context:
  check_runs:
    workflows: [CI, Tests]                                    # Filter by workflow name
    status: [success, failure, neutral, cancelled, skipped, timed_out]  # Filter by status
    limit: 100                                                # Max check runs (default: 100)
```

## Collected Data

Each check run includes:
- Check run name and ID
- Workflow name
- Status and conclusion
- Started and completed timestamps
- Duration
- Associated commit SHA and branch
- Pull request number (if applicable)
- Check run URL

## Examples

<details>
<summary>Example: Flaky test detector</summary>

```yaml
name: Flaky Test Detector
on:
  schedule:
    - cron: '0 8 * * *'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  check_runs:
    workflows: [Tests]
    status: [failure, success]
  since: 7d
  min_items: 10
```

```markdown
Detect flaky tests from the past week:

1. Analyze test check runs for the same commit/PR
2. Identify tests that failed then passed on retry
3. Track tests with inconsistent results across similar runs
4. If 3+ flaky tests detected:
   - Create an issue titled "Flaky Tests Detected - Week of [date]"
   - List each flaky test with:
     - Test name
     - Failure rate
     - Example run URLs
   - Add label: flaky-tests

This helps identify unreliable tests needing investigation.
```

</details>

<details>
<summary>Example: CI failure summary</summary>

```yaml
name: CI Failure Report
on:
  schedule:
    - cron: '0 18 * * FRI'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  check_runs:
    status: [failure, timed_out]
  since: 7d
```

```markdown
Generate a weekly CI failure report:

1. Group failures by workflow and failure type
2. Calculate failure rate per workflow
3. Identify most common failure reasons
4. Create an issue with:
   - Total runs vs failures
   - Failure rate by workflow
   - Top failure patterns
   - Slowest running workflows
5. Add label: ci-report

This helps prioritize CI stability improvements.
```

</details>

<details>
<summary>Example: Long-running workflow alert</summary>

```yaml
name: Slow CI Alert
on:
  schedule:
    - cron: '0 */6 * * *'

permissions:
  issues: write

outputs:
  add-comment: { max: 1 }

context:
  check_runs:
    status: [success, failure]
  pull_requests:
    states: [open]
  since: 6h
```

```markdown
Monitor for unusually long-running workflows:

For each check run that took >30 minutes in the last 6 hours:
1. Find the associated PR (if any)
2. Add a comment to the PR:
   - Notify that the workflow took longer than usual
   - Suggest checking for performance issues
   - Link to the workflow run

This helps identify CI performance degradation early.
```

</details>
