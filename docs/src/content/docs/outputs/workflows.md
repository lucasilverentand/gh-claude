---
title: Workflows
description: Enable agents to trigger GitHub Actions workflows
---

The `trigger-workflow` output allows your agent to programmatically dispatch GitHub Actions workflows using the `workflow_dispatch` event. This enables agents to orchestrate multi-step processes, trigger deployments, or initiate other automated workflows.

## Basic Example

```yaml
name: Deployment Orchestrator
on:
  pull_request:
    types: [closed]

permissions:
  actions: write

outputs:
  trigger-workflow: true
```

## Available Outputs

### trigger-workflow

Trigger workflows that accept `workflow_dispatch` events, optionally passing inputs.

```yaml
outputs:
  trigger-workflow: true     # boolean — default: false
```

## Permission Requirements

Triggering workflows requires the `actions: write` permission:

```yaml
permissions:
  actions: write
```

## How It Works

When an agent wants to trigger a workflow, it writes a JSON file to `/tmp/outputs/trigger-workflow.json` containing the workflow file name or ID, optional ref (branch/tag), and any workflow inputs defined in the target workflow's `workflow_dispatch` configuration.

The JSON structure requires a `workflow` field for the workflow file name (e.g., `deploy.yml`) or workflow ID. An optional `ref` field specifies the git reference (defaults to the repository's default branch). The `inputs` field contains key-value pairs matching the workflow's defined inputs.

## Best Practices

Only trigger workflows that are designed to be dispatched. Ensure the target workflow has `workflow_dispatch` configured in its `on` triggers and that any required inputs are properly specified.

Be cautious with workflows that have side effects like deployments or data modifications. Consider adding approval steps or safeguards in the triggered workflows themselves.

Use descriptive workflow inputs to provide context about why the workflow was triggered. This creates a better audit trail and helps debug issues when automated triggers behave unexpectedly.

Consider rate limiting and avoiding triggering the same workflow multiple times unnecessarily. Check if a workflow is already running before dispatching a new one.

## Examples

<details>
<summary>Example: Auto-deploy on PR merge</summary>

```yaml
name: Auto Deploy
on:
  pull_request:
    types: [closed]

permissions:
  actions: write
  pull_requests: read

outputs:
  trigger-workflow: true
  add-comment: { max: 1 }
```

```markdown
When a pull request is merged to the main branch:

1. Check if the PR has the "auto-deploy" label
2. If yes, trigger the "deploy.yml" workflow with these inputs:
   - environment: "staging"
   - pr_number: [the PR number]
   - triggered_by: "repo-agents"
3. Add a comment to the PR with a link to the triggered workflow run

Only trigger deployment for PRs labeled "auto-deploy" and merged to main.
```

</details>

<details>
<summary>Example: Scheduled maintenance workflow trigger</summary>

```yaml
name: Maintenance Scheduler
on:
  schedule:
    - cron: '0 2 * * SUN'

permissions:
  actions: write

outputs:
  trigger-workflow: true

context:
  pull_requests:
    states: [open]
    labels: [dependencies]
  since: 7d
  min_items: 5
```

```markdown
If there are 5+ open dependency update PRs from the last week:

Trigger the "merge-dependabot.yml" workflow to batch-merge them.

Pass these inputs:
- max_prs: "10"
- auto_approve: "true"
- labels: "dependencies"

This reduces PR noise by consolidating dependency updates on weekends.
```

</details>

<details>
<summary>Example: CI retry on flaky tests</summary>

```yaml
name: Flaky Test Retry
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

permissions:
  actions: write

outputs:
  trigger-workflow: true

context:
  workflow_runs:
    workflows: ["CI"]
    status: [failure]
  since: 1h
```

```markdown
If the CI workflow just failed, check if the failure was due to known flaky tests.

Look for test names matching our flaky test patterns in the workflow logs.

If 3+ failures are from flaky tests, trigger the "ci.yml" workflow again
with the same ref to retry the tests.

Add a workflow input "retry_attempt" with the current retry count.
Stop after 2 retries to prevent infinite loops.
```

</details>
