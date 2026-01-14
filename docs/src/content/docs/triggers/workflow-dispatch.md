---
title: Workflow Dispatch
description: Manually trigger agents with optional inputs
---

The `workflow_dispatch` trigger allows you to run an agent on-demand through the GitHub Actions UI, the GitHub CLI, or the API. This is useful for one-off tasks, testing new agents before enabling automatic triggers, or operations that require user-provided parameters.

## Basic Example

```yaml
---
name: Repository Analysis
on:
  workflow_dispatch:
permissions:
  issues: read
  pull_requests: read
---

Analyze the repository and provide a summary of open issues and pull requests.
```

This minimal configuration enables manual triggering with no inputs. Navigate to the Actions tab in your repository, select the workflow, and click "Run workflow" to execute it.

## Configuration Options

When you need to collect information from the user at runtime, define an `inputs` object under `workflow_dispatch`. Each key becomes a field in the GitHub UI.

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'  # required
        type: choice                        # string — default: string
        options: [dev, staging, prod]       # required when type is choice
        required: true                      # boolean — default: false
        default: dev                        # string
```

**description** — Human-readable label shown in the GitHub UI.

**type** — Input type: `string`, `boolean`, or `choice`.

**options** — List of valid values. Required when `type` is `choice`.

**required** — Whether the input must be provided.

**default** — Default value if not provided.

Input values become available in the generated workflow as `${{ inputs.inputName }}`.

## Rate Limiting Behavior

Unlike other triggers, manual `workflow_dispatch` runs bypass the rate limit check entirely. This allows you to run an agent immediately even if it recently executed, which is particularly useful during development and testing.

## Best Practices

Write descriptive help text that includes examples of valid values. A description like "Issue number to process (e.g., 123)" is far more helpful than just "number". Users should understand exactly what to enter without guessing.

Use the `choice` type whenever you have a known set of valid options. This prevents typos and makes the interface self-documenting. A dropdown with "low", "medium", and "high" options is better than a free-text field where users might enter "Low", "HIGH", or "med".

Set safe defaults for potentially destructive operations. If an agent can modify repository content, consider defaulting a dry-run mode to `true` so users must explicitly opt into making changes.

Combine `workflow_dispatch` with automatic triggers when you want both behaviors. An agent can respond to new issues automatically while also being available for manual runs against specific issues.

```yaml
on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issueNumber:
        description: 'Process a specific issue by number'
        type: string
```

## More Examples

<details>
<summary>Example: Custom Report Generator</summary>

```yaml
---
name: Custom Report
on:
  workflow_dispatch:
    inputs:
      reportType:
        description: 'Type of report to generate'
        type: choice
        options:
          - issues-summary
          - pr-summary
          - contributor-stats
        default: issues-summary
      startDate:
        description: 'Start date (YYYY-MM-DD)'
        required: true
        type: string
      endDate:
        description: 'End date (YYYY-MM-DD)'
        required: true
        type: string
permissions:
  issues: read
  pull_requests: read
---

Generate a custom report based on the selected type and date range.
Validate the date format before proceeding.
Format the output as a markdown summary.
```

</details>

<details>
<summary>Example: Emergency Issue Investigation</summary>

```yaml
---
name: Emergency Investigation
on:
  workflow_dispatch:
    inputs:
      issueNumber:
        description: 'Issue number to investigate'
        required: true
        type: string
      priority:
        description: 'Investigation priority level'
        type: choice
        options:
          - critical
          - high
          - normal
        default: normal
permissions:
  issues: write
outputs:
  add-comment: true
---

Investigate the specified issue thoroughly.
Review all related code paths and recent changes.
Add a detailed comment with findings and recommended next steps.
```

</details>

<details>
<summary>Example: Bulk Label Migration</summary>

```yaml
---
name: Label Migration
on:
  workflow_dispatch:
    inputs:
      fromLabel:
        description: 'Label to migrate from'
        required: true
        type: string
      toLabel:
        description: 'Label to migrate to'
        required: true
        type: string
      dryRun:
        description: 'Preview changes without applying'
        type: boolean
        default: true
permissions:
  issues: write
outputs:
  add-label: true
  remove-label: true
---

Find all issues with the source label.
If dry run is enabled, list what would change without modifying anything.
Otherwise, add the new label and remove the old one from each issue.
Report the total number of issues processed.
```

</details>

<details>
<summary>Example: Testing Before Automatic Triggers</summary>

```yaml
---
name: Issue Responder (Testing)
on:
  workflow_dispatch:
    inputs:
      issueNumber:
        description: 'Issue to test with'
        required: true
        type: string
      testMode:
        description: 'Test intensity'
        type: choice
        options:
          - minimal
          - full
        default: minimal
  # Uncomment after testing:
  # issues:
  #   types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
---

Test the issue response workflow with the specified issue.
In minimal mode, analyze but do not post comments.
In full mode, post a real response.
```

</details>
