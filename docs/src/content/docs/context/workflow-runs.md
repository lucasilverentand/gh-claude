---
title: Workflow Runs
description: Collect and filter workflow execution data
---

The workflow runs context type collects GitHub Actions run data from your repository. This is useful for agents that monitor CI/CD health, alert on failures, or generate pipeline performance reports.

## Basic Example

```yaml
context:
  workflow_runs:
    status: [failure]
    limit: 50
  since: last-run
```

## Configuration Options

```yaml
context:
  workflow_runs:
    workflows: [ci.yml]      # string[]
    status: [failure]        # string[] — default: [failure]
    branches: [main]         # string[]
    limit: 50                # number — default: 50
```

**workflows** — Filter to specific workflow files.

**status** — Filter by conclusion: `success`, `failure`, `cancelled`, `skipped`.

**branches** — Filter to runs from specific branches.

**limit** — Maximum runs to collect. Range: `1`-`1000`.

## Best Practices

Filter by status to reduce noise. In most cases, you only need to know about failures or specific outcomes rather than every single run. The default of only collecting failures reflects this common pattern.

Specify workflow file names when you have many workflows but only care about a subset. Monitoring your core CI workflow separately from documentation builds or dependency updates helps focus the agent's attention.

Combine workflow runs with the `min_items` threshold to skip agent execution when there are no failures. Setting `min_items: 1` ensures the agent only runs when there's actually something to report, which saves on API costs and avoids empty notifications.

Use the `branches` filter for production monitoring. When you only care about failures on `main` or your release branches, filtering by branch prevents noise from feature branch CI runs.

## More Examples

<details>
<summary>Example: CI/CD health monitoring</summary>

```yaml
---
name: CI Health Monitor
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch: {}
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
context:
  workflow_runs:
    status: [failure]
    branches: [main]
    limit: 20
  since: last-run
  min_items: 1
---

Monitor workflow failures on the main branch and create an issue when problems are detected. Summarize which workflows failed, link to the run logs, and suggest investigation steps based on the failure patterns.
```

</details>

<details>
<summary>Example: Specific workflow monitoring</summary>

```yaml
context:
  workflow_runs:
    workflows: [test.yml, build.yml]
    status: [failure, cancelled]
    limit: 30
  since: 24h
```

This configuration monitors only your test and build workflows, capturing both failures and cancelled runs from the past 24 hours. Useful when you want to track CI stability for core pipelines separately from other automation.

</details>

<details>
<summary>Example: Weekly pipeline health report</summary>

```yaml
---
name: Weekly Pipeline Report
on:
  schedule:
    - cron: '0 9 * * 1'
  workflow_dispatch: {}
permissions:
  discussions: write
outputs:
  create-discussion: true
context:
  workflow_runs:
    status: [success, failure, cancelled]
    branches: [main, develop]
    limit: 200
  since: 7d
  min_items: 10
---

Generate a weekly summary of pipeline health. Calculate success rates for each workflow, identify flaky tests or recurring failures, and highlight any patterns in when failures occur. Post the report as a discussion for team visibility.
```

</details>

<details>
<summary>Example: Deployment tracking</summary>

```yaml
context:
  workflow_runs:
    workflows: [deploy.yml, release.yml]
    status: [success, failure]
    branches: [main]
    limit: 50
  since: 7d
```

This tracks deployment and release workflow runs on the main branch. Useful for generating deployment frequency metrics or alerting when production deployments fail.

</details>

<details>
<summary>Example: Minimal failure alerting</summary>

```yaml
context:
  workflow_runs: {}
  since: last-run
  min_items: 1
```

This uses all defaults: monitors failures from all workflows and branches, retrieves up to 50 runs, and filters to runs since the last successful execution. The `min_items: 1` ensures the agent only runs when there's at least one failure to report.

</details>
