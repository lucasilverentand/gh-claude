---
title: Workflow Run Events
description: Trigger agents when other workflows complete
---

Trigger your agent when another workflow in your repository completes, allowing you to chain workflows together or react to CI/CD results.

## Basic Configuration

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
```

This triggers when the workflow named "CI" completes (regardless of success or failure).

## Required Fields

### workflows

An array of workflow names (not file names) that should trigger this agent:

```yaml
on:
  workflow_run:
    workflows:
      - CI
      - Build
      - Tests
```

The names must match the `name` field in the target workflow files exactly.

## Available Event Types

- **`completed`** - Workflow run has finished (success, failure, or cancelled)
- **`requested`** - Workflow run is requested (about to start)
- **`in_progress`** - Workflow run has started executing

## Branch Filtering

### branches

Only trigger for workflow runs on specific branches:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches:
      - main
      - develop
```

### branches-ignore

Exclude workflow runs on specific branches:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches-ignore:
      - 'dependabot/**'
      - 'renovate/**'
```

Note: You cannot use both `branches` and `branches-ignore` together.

## Common Use Cases

### Post-CI Analysis

Run analysis after CI completes, regardless of result:

```yaml
---
name: CI Results Analyzer
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
permissions:
  issues: write
  pull_requests: write
outputs:
  add-comment: true
---

Analyze CI results:
1. Check if the workflow succeeded or failed
2. If failed, identify the failing step
3. Provide suggestions for fixing common issues
4. Post analysis as a comment on the PR
```

### Deploy After Tests Pass

Chain deployment after successful tests:

```yaml
---
name: Auto Deploy
on:
  workflow_run:
    workflows: [Tests]
    types: [completed]
    branches: [main]
permissions:
  contents: write
outputs:
  create-pr: true
allowed-paths:
  - deploy/**
---

After tests complete successfully on main:
1. Check that the workflow conclusion is 'success'
2. Prepare deployment configuration
3. Create a PR with deployment updates
4. Add deployment checklist to PR description
```

### Failure Investigation

Automatically investigate CI failures:

```yaml
---
name: CI Failure Investigator
on:
  workflow_run:
    workflows: [CI, Tests, Build]
    types: [completed]
permissions:
  issues: write
outputs:
  add-comment: true
  create-issue: true
---

When any CI workflow fails:
1. Check if conclusion is 'failure'
2. Download and analyze workflow logs
3. Identify the root cause of failure
4. Post findings as a comment
5. Create issue for recurring failures
```

### Test Coverage Report

Generate coverage reports after tests complete:

```yaml
---
name: Coverage Reporter
on:
  workflow_run:
    workflows: [Tests]
    types: [completed]
    branches: [main, develop]
permissions:
  pull_requests: write
outputs:
  add-comment: true
---

After tests complete:
1. Download coverage artifacts if available
2. Compare with baseline coverage
3. Generate coverage summary
4. Post report as PR comment
```

## Available Data

When your agent runs, it has access to:

- **Workflow name** - via `${{ github.event.workflow_run.name }}`
- **Workflow ID** - via `${{ github.event.workflow_run.id }}`
- **Conclusion** - via `${{ github.event.workflow_run.conclusion }}`
- **Status** - via `${{ github.event.workflow_run.status }}`
- **Head branch** - via `${{ github.event.workflow_run.head_branch }}`
- **Head SHA** - via `${{ github.event.workflow_run.head_sha }}`
- **Triggering actor** - via `${{ github.event.workflow_run.triggering_actor.login }}`
- **Run URL** - via `${{ github.event.workflow_run.html_url }}`

### Workflow Conclusions

The `conclusion` field can be:
- `success` - Workflow completed successfully
- `failure` - Workflow failed
- `cancelled` - Workflow was cancelled
- `skipped` - Workflow was skipped
- `timed_out` - Workflow exceeded time limit
- `action_required` - Workflow requires manual action

Access this data using the `gh` CLI:

```bash
# Get workflow run details
gh run view ${{ github.event.workflow_run.id }}

# Get workflow run logs
gh run view ${{ github.event.workflow_run.id }} --log
```

## Checking Workflow Result

Your agent instructions should check the workflow conclusion:

```yaml
---
name: Conditional Handler
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
---

Based on the workflow result:
1. If conclusion is 'success', proceed with deployment
2. If conclusion is 'failure', investigate and report
3. If conclusion is 'cancelled', log and skip further action
```

## Multiple Workflows

Trigger on multiple workflow completions:

```yaml
on:
  workflow_run:
    workflows:
      - CI
      - Integration Tests
      - Security Scan
    types: [completed]
```

The agent will run when ANY of these workflows complete.

## Required Permissions

For read-only operations:

```yaml
permissions:
  contents: read
```

For operations that modify issues or PRs:

```yaml
permissions:
  issues: write
  pull_requests: write
```

See [Permissions](../../guide/permissions/) for details.

## Best Practices

### Check Workflow Conclusion

Always verify the workflow result before taking action:

```yaml
---
name: Success-Only Handler
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
---

IMPORTANT: Only proceed if the workflow succeeded.
1. Check that conclusion equals 'success'
2. If not successful, skip all actions
3. Only perform deployment/notification on success
```

### Use Branch Filtering

Limit triggers to relevant branches:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]  # Only for main branch
```

### Handle All Outcomes

Consider what should happen for each possible conclusion:

```yaml
---
name: Comprehensive CI Handler
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
---

Handle workflow completion:
- On SUCCESS: Update status badge, notify team of success
- On FAILURE: Investigate logs, post failure analysis
- On CANCELLED: Log cancellation, no further action
- On TIMED_OUT: Create issue about slow tests
```

### Avoid Infinite Loops

Be careful not to create circular dependencies:

```yaml
# Workflow A triggers Workflow B
# Workflow B should NOT trigger Workflow A
```

## Examples

### Auto-Merge on CI Success

```yaml
---
name: Auto Merge
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
permissions:
  pull_requests: write
  contents: write
outputs:
  add-comment: true
---

When CI passes on a PR:
1. Check workflow conclusion is 'success'
2. Verify PR has 'auto-merge' label
3. Check required reviews are approved
4. Enable auto-merge if all conditions met
5. Post confirmation comment
```

### Nightly Build Reporter

```yaml
---
name: Nightly Report
on:
  workflow_run:
    workflows: [Nightly Build]
    types: [completed]
permissions:
  issues: write
outputs:
  create-issue: true
---

After nightly build completes:
1. Gather build metrics and test results
2. Compare with previous night's results
3. Highlight any regressions
4. Create summary issue with findings
5. Tag relevant team members if failures found
```

### Security Scan Handler

```yaml
---
name: Security Alert Handler
on:
  workflow_run:
    workflows: [Security Scan]
    types: [completed]
permissions:
  issues: write
outputs:
  create-issue: true
  add-label: true
---

When security scan completes:
1. Check if any vulnerabilities were found
2. If critical issues, create urgent issue
3. Apply appropriate priority labels
4. Include remediation suggestions
5. Reference relevant security advisories
```

## Combining with Other Triggers

Use with workflow_dispatch for manual reruns:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
  workflow_dispatch:
    inputs:
      run_id:
        description: 'Workflow run ID to analyze'
        required: true
        type: string
```

This allows:
- Automatic triggering after CI completes
- Manual analysis of specific workflow runs

## Downloading Artifacts

Access artifacts from the triggering workflow:

```bash
# List artifacts from the triggering run
gh run view ${{ github.event.workflow_run.id }} --json artifacts

# Download specific artifact
gh run download ${{ github.event.workflow_run.id }} -n artifact-name
```

## Limitations

- The `workflows` array uses workflow names, not file names
- You cannot filter by workflow conclusion directly in the trigger (check in agent instructions)
- Workflow run events have a 30-day retention limit
- Branch filters apply to the triggering workflow's branch, not the current workflow

## Next Steps

- Learn about [Release triggers](release/) for release automation
- Understand [Repository Dispatch](repository-dispatch/) for API triggering
- See [Schedule triggers](schedule/) for time-based automation
