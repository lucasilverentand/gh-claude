---
title: Workflow Runs Input Type
description: Collect and filter workflow execution data
---

Collect workflow execution data to monitor CI/CD pipeline health and performance.

## Configuration

```yaml
inputs:
  workflow_runs:
    workflows: [test.yml, build.yml]
    status: [failure, success]
    branches: [main, develop]
    limit: 50
```

## Configuration Options

- **`workflows`** (array): Filter by workflow file names or IDs
  - Specify workflow file names (e.g., `test.yml`, `build.yml`)
  - Or use workflow IDs from GitHub
  - Leave empty to include all workflows

- **`status`** (array): Filter by conclusion status
  - `success` - Successful runs
  - `failure` - Failed runs
  - `cancelled` - Cancelled runs
  - `skipped` - Skipped runs
  - Can include multiple statuses

- **`branches`** (array): Only runs on these branches
  - Specify branch names (e.g., `main`, `develop`)
  - Leave empty to include all branches

- **`limit`** (number): Maximum runs to fetch
  - Default: `50`
  - Maximum: `1000`

## Output Format

When Claude receives workflow runs data, it's formatted like this:

```markdown
## ⚙️ Workflow Runs

### CI Tests - Run #152
**Status:** failure | **Branch:** main | **Author:** @developer
**Created:** 2024-01-15T10:45:00Z
**URL:** https://github.com/owner/repo/actions/runs/12345

---

### Build - Run #89
**Status:** success | **Branch:** develop | **Author:** @developer
**Created:** 2024-01-15T10:30:00Z
**URL:** https://github.com/owner/repo/actions/runs/12344

---
```

Each workflow run includes:
- Workflow name
- Run number
- Final status (success/failure/cancelled/skipped)
- Branch it ran on
- Author/trigger
- Timestamp
- Direct link to the run

## Configuration Examples

### Failed Runs Only

Collect workflow failures:

```yaml
inputs:
  workflow_runs:
    status: [failure]
    limit: 50
```

### Main Branch CI

Monitor CI runs on main branch:

```yaml
inputs:
  workflow_runs:
    workflows: [test.yml, lint.yml]
    status: [success, failure]
    branches: [main]
    limit: 50
```

### All Statuses

Collect all workflow runs regardless of status:

```yaml
inputs:
  workflow_runs:
    status: [success, failure, cancelled, skipped]
    limit: 100
```

### Specific Workflow

Monitor a specific workflow:

```yaml
inputs:
  workflow_runs:
    workflows: [build.yml]
    limit: 50
```

### Production Deployments

Monitor deployment workflow:

```yaml
inputs:
  workflow_runs:
    workflows: [deploy.yml]
    branches: [main]
    status: [success, failure]
    limit: 30
```

### Recent Failures

Get recent failures on any branch:

```yaml
inputs:
  workflow_runs:
    status: [failure]
    limit: 100
```

## Use Cases

### 1. Failure Monitoring

Alert when workflows fail:

```yaml
inputs:
  workflow_runs:
    status: [failure]
    limit: 50
  since: last-run
  min_items: 1
```

Claude could create alerts about failed tests or builds.

### 2. Pipeline Health Report

Monitor overall CI/CD health:

```yaml
inputs:
  workflow_runs:
    status: [success, failure, cancelled]
    limit: 100
  since: 7d
  min_items: 1
```

Claude could generate a health report showing success rate.

### 3. Build Performance Tracking

Monitor build times and performance:

```yaml
inputs:
  workflow_runs:
    workflows: [build.yml]
    branches: [main]
    limit: 50
```

Claude could track build time trends.

### 4. Deployment Monitoring

Track deployment runs:

```yaml
inputs:
  workflow_runs:
    workflows: [deploy.yml]
    branches: [main]
    status: [success, failure]
    limit: 30
  since: last-run
  min_items: 1
```

Claude could notify about successful deployments.

### 5. Test Suite Analysis

Analyze test run results:

```yaml
inputs:
  workflow_runs:
    workflows: [test.yml, integration-tests.yml]
    branches: [main, develop]
    limit: 100
```

Claude could identify flaky tests or patterns.

## Real-World Example

A CI/CD health monitor that alerts on failures:

```yaml
---
name: CI/CD Health Monitor
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch: {}
permissions:
  contents: read
  actions: read
outputs:
  add-comment: true
inputs:
  workflow_runs:
    status: [failure]
    branches: [main, develop]
    limit: 50
  since: last-run
  min_items: 1
---

Monitor workflow failures and create a summary with:

1. **Failed Runs**: List all failed runs with links
2. **By Workflow**: Group failures by workflow type
3. **Recent Failures**: Most recent failures first
4. **Impact**: Which branches are affected

Add comments to the latest commit on affected branches
noting that tests are failing and need attention.
```

## Performance Tips

### Filter by Status

Be specific about which statuses you need:

```yaml
# Better - specific statuses
inputs:
  workflow_runs:
    status: [failure]
    limit: 50

# Avoid - all statuses (lots of successful runs)
inputs:
  workflow_runs:
    limit: 1000
```

### Filter by Workflow

Target specific workflows:

```yaml
# Better - specific workflows
inputs:
  workflow_runs:
    workflows: [test.yml, build.yml]
    limit: 50

# Avoid - all workflows
inputs:
  workflow_runs:
    limit: 500
```

### Filter by Branch

Focus on critical branches:

```yaml
# Better - main branch only
inputs:
  workflow_runs:
    branches: [main]
    limit: 50

# Avoid - all branches
inputs:
  workflow_runs:
    limit: 500
```

## Workflow Status Reference

### Success

The workflow completed successfully:
- All jobs passed
- Indicates healthy pipeline
- Good for deployment readiness checks

### Failure

The workflow failed:
- At least one job failed
- Indicates pipeline issues
- Useful for alerting

### Cancelled

The workflow was manually cancelled:
- User stopped the run
- Not an automatic failure
- Usually less critical

### Skipped

The workflow was skipped:
- Conditional rules prevented execution
- Filters excluded it
- May indicate configuration issues

## Common Configurations

### Failures Only

```yaml
workflow_runs:
  status: [failure]
  limit: 50
```

### Main Branch Monitoring

```yaml
workflow_runs:
  branches: [main]
  status: [success, failure]
  limit: 50
```

### Specific Pipeline

```yaml
workflow_runs:
  workflows: [test.yml, build.yml]
  limit: 100
```

### All Critical

```yaml
workflow_runs:
  workflows: [test.yml, build.yml, deploy.yml]
  status: [success, failure]
  limit: 100
```

## Referencing Workflows

To filter by specific workflows, use the workflow filename from your `.github/workflows/` directory:

```yaml
inputs:
  workflow_runs:
    workflows: [test.yml, build.yml]  # Use the filename
```

The workflow name (set in the `name:` field of the workflow file) is shown in the output for reference, but you filter using the filename.

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Issues](./issues/): Collect related issues from failures
- [Pull Requests](./pull-requests/): Find PRs that caused failures
