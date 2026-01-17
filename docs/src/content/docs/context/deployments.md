---
title: Deployments
description: Collect deployment history with environment and status filters
---

The `deployments` context type collects deployment information from your repository, enabling agents to track deployment success rates, monitor environments, and automate post-deployment workflows.

## Basic Example

```yaml
name: Deployment Monitor
on:
  schedule:
    - cron: '0 */6 * * *'

context:
  deployments:
    environments: [production]
    states: [success, failure]
  since: 6h
```

## Configuration Options

```yaml
context:
  deployments:
    environments: [production, staging]           # Filter by environment name
    states: [success, failure, error, pending, in_progress]  # Filter by deployment state
    limit: 50                                     # Max deployments (default: 100)
```

## Collected Data

Each deployment includes:
- Deployment ID and environment
- State (success, failure, error, pending, in_progress)
- Created and updated timestamps
- Deployer (user or bot)
- Ref (branch, tag, or commit SHA)
- Description
- Environment URL

## Examples

<details>
<summary>Example: Production deployment alerts</summary>

```yaml
name: Production Deploy Alert
on:
  schedule:
    - cron: '0 * * * *'  # Hourly

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  deployments:
    environments: [production]
    states: [failure, error]
  since: 1h
  min_items: 1
```

```markdown
Monitor for failed production deployments.

If a production deployment failed in the last hour:
1. Create a high-priority issue titled "Production Deployment Failed"
2. Include:
   - Deployment ID and timestamp
   - Deployed ref (branch/tag/commit)
   - Error details (if available)
   - Who initiated the deployment
3. Add labels: deployment-failure, priority/critical
4. Mention on-call team

This ensures immediate visibility of production issues.
```

</details>

<details>
<summary>Example: Deployment success rate report</summary>

```yaml
name: Deployment Report
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  deployments:
    states: [success, failure, error]
  since: 7d
```

```markdown
Generate a weekly deployment report:

1. Calculate deployment success rate by environment
2. Count total deployments per environment
3. Identify environments with repeated failures
4. Create an issue with:
   - Success rate per environment
   - Total deployments
   - Failed deployment details
   - Trends compared to previous week

Skip if no deployments occurred this week.
```

</details>

<details>
<summary>Example: Staging deployment verification</summary>

```yaml
name: Staging Deploy Check
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

permissions:
  pull_requests: write

outputs:
  add-label: true

context:
  deployments:
    environments: [staging]
    states: [success]
  pull_requests:
    states: [open]
    labels: [ready-to-deploy]
  since: 4h
```

```markdown
Track which PRs have been deployed to staging:

For each successful staging deployment in the last 4 hours:
1. Find the deployed commit SHA
2. Find open PRs containing that commit
3. Add label "deployed-to-staging" to those PRs
4. Add label "staging-verified" once deployment is confirmed stable

This helps track which features are in staging for QA.
```

</details>
