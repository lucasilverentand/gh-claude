---
title: Advanced Topics
description: Advanced patterns and techniques for gh-claude agents
---

This guide covers advanced topics for building sophisticated gh-claude agents, including complex triggers, input collection, cost optimization, and multi-agent coordination.

## Workflow Dispatch Inputs

workflow_dispatch allows manual triggering with user-provided inputs, enabling flexible, on-demand agent execution.

### Basic Pattern

```yaml
on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Target to analyze'
        required: true
        type: string
      mode:
        description: 'Analysis mode'
        type: choice
        options:
          - quick
          - detailed
          - comprehensive
        default: quick
```

In your agent instructions, reference inputs to guide behavior:

```markdown
You are analyzing the repository based on these parameters:

- Target: Use the workflow input "target" to focus your analysis
- Mode: Adjust depth based on the "mode" input (quick, detailed, or comprehensive)

For quick mode: Provide a brief summary
For detailed mode: Include analysis and recommendations
For comprehensive mode: Deep dive with examples and actionable steps
```

### Advanced Input Patterns

**Conditional Logic Based on Inputs:**

```yaml
---
name: Flexible Report Generator
on:
  workflow_dispatch:
    inputs:
      reportType:
        description: 'Type of report'
        type: choice
        options:
          - issues-summary
          - pr-review-stats
          - contributor-activity
          - security-audit
      startDate:
        description: 'Start date (YYYY-MM-DD)'
        required: true
        type: string
      endDate:
        description: 'End date (YYYY-MM-DD)'
        required: true
        type: string
      includeCharts:
        description: 'Generate visualizations'
        type: boolean
        default: false
      outputFormat:
        description: 'Output format'
        type: choice
        options:
          - markdown
          - json
          - csv
permissions:
  issues: read
  pull_requests: read
outputs:
  create-issue: { max: 1 }
---

Generate a custom report based on the provided inputs.

## Report Configuration
- Type: {{ inputs.reportType }}
- Period: {{ inputs.startDate }} to {{ inputs.endDate }}
- Visualizations: {{ inputs.includeCharts }}
- Format: {{ inputs.outputFormat }}

## Instructions

1. Validate the date range
2. Based on reportType, collect appropriate data:
   - issues-summary: All issues created/closed in period
   - pr-review-stats: PR review metrics and timing
   - contributor-activity: Contributions by user
   - security-audit: Security-related issues and PRs

3. If includeCharts is true, include ASCII charts or mermaid diagrams
4. Format output according to outputFormat choice
5. Create an issue with the report (or comment if outputFormat is not markdown)
```

**Safe Operations with Confirmation:**

```yaml
---
name: Bulk Label Migration
on:
  workflow_dispatch:
    inputs:
      oldLabel:
        description: 'Label to replace'
        required: true
        type: string
      newLabel:
        description: 'New label name'
        required: true
        type: string
      scope:
        description: 'What to update'
        type: choice
        options:
          - issues-only
          - prs-only
          - both
      dryRun:
        description: 'Preview without making changes'
        type: boolean
        default: true
permissions:
  issues: write
  pull_requests: write
outputs:
  add-comment: { max: 1 }
  add-label: true
  remove-label: true
---

Migrate labels safely with dry-run support.

**IMPORTANT:** If dryRun is true, only analyze and report what would change. Do NOT modify labels.

1. Find all items with "{{ inputs.oldLabel }}" based on scope
2. List what would be changed
3. If dryRun is false, perform the migration:
   - Add "{{ inputs.newLabel }}" to each item
   - Remove "{{ inputs.oldLabel }}"
4. Report results in a comment
```

## Combining Multiple Triggers

Agents can respond to multiple trigger types, providing both automated and manual operation modes.

### Hybrid Automation Pattern

```yaml
---
name: Issue Analyzer
on:
  issues:
    types: [opened, labeled]
  workflow_dispatch:
    inputs:
      issueNumber:
        description: 'Specific issue to analyze'
        type: string
  schedule:
    - cron: '0 0 * * MON'  # Weekly review
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

Analyze issues through multiple pathways:

**If triggered by new issue:**
- Perform immediate triage
- Add initial labels
- Post welcoming comment

**If triggered manually with issue number:**
- Deep analysis of specified issue
- Review history and context
- Provide detailed recommendations

**If triggered by schedule:**
- Review all open issues
- Identify stale or problematic issues
- Suggest cleanup actions
```

### Context-Aware Multi-Trigger

```yaml
---
name: Smart Documentation Agent
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'docs/**'
      - 'README.md'
  workflow_dispatch:
    inputs:
      action:
        description: 'Documentation action'
        type: choice
        options:
          - audit-completeness
          - check-links
          - update-examples
  schedule:
    - cron: '0 12 * * FRI'  # Friday noon
permissions:
  contents: write
  pull_requests: write
allowed-paths:
  - docs/**
  - README.md
outputs:
  add-comment: { max: 1 }
  update-file: true
---

Handle documentation intelligently based on trigger:

**On PR to docs:**
- Check for broken links
- Verify code examples are current
- Suggest improvements
- Add comment with findings

**On manual trigger:**
- Execute the specified action
- Report findings
- Make corrections if appropriate

**On schedule:**
- Full documentation audit
- Update stale examples
- Check for broken links
- Create issue with audit results
```

## Complex Label-Based Triggering

Use labels to create sophisticated workflow routing.

### State Machine Pattern

```yaml
---
name: Progressive Issue Handler
on:
  issues:
    types: [labeled]
trigger_labels:
  - needs-investigation
  - needs-reproduction
  - needs-design
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
  remove-label: true
---

Act as a state machine for issue progression:

1. Check which label triggered this run
2. Based on current label:

   **needs-investigation:**
   - Analyze issue description
   - Request additional information if unclear
   - Add "investigating" label
   - Remove "needs-investigation"

   **needs-reproduction:**
   - Check for reproduction steps
   - Attempt to create minimal reproduction
   - Add "reproduced" or "cannot-reproduce" label
   - Remove "needs-reproduction"

   **needs-design:**
   - Review proposed solutions
   - Consider alternatives
   - Suggest design approach
   - Add "design-reviewed" label
   - Remove "needs-design"

3. Update issue with findings and next steps
```

### Multi-Label Coordination

```yaml
---
name: Security Issue Escalator
on:
  issues:
    types: [opened, labeled, edited]
trigger_labels:
  - security
  - vulnerability
  - cve
allowed-teams:
  - security-team
permissions:
  issues: write
outputs:
  add-label: true
  add-comment: { max: 1 }
  create-issue: { max: 1 }
---

Escalate security issues through proper channels:

1. Detect security-related labels
2. Check if issue is public (it shouldn't be!)
3. Add "needs-triage" and "priority: critical" labels
4. If public:
   - Add warning comment
   - Request reporter to email security contact
   - Create private tracking issue for security team
5. If already triaged:
   - Verify proper labels are applied
   - Ensure security team is notified
```

## Managing Multiple Interacting Agents

Coordinate multiple agents to avoid conflicts and create complex workflows.

### Agent Coordination Strategy

**1. Divide Responsibilities Clearly:**

```yaml
# agent-1-triage.md - Initial categorization
---
name: Issue Triage
on:
  issues:
    types: [opened]
outputs:
  add-label: true
  add-comment: { max: 1 }
---
Add category labels: bug, feature, docs, question
Do NOT assign priority or ownership.

# agent-2-prioritize.md - Priority assessment
---
name: Priority Assessment
on:
  issues:
    types: [labeled]
trigger_labels:
  - bug
  - feature
outputs:
  add-label: true
---
Add priority labels based on impact and urgency.
Only runs after triage agent adds category.

# agent-3-assign.md - Assignment
---
name: Auto Assignment
on:
  issues:
    types: [labeled]
trigger_labels:
  - priority: high
  - priority: critical
allowed-teams:
  - maintainers
---
Assign high-priority issues to appropriate team members.
Only runs after priority is set.
```

**2. Use Labels as Handoff Signals:**

```yaml
---
name: PR Initial Review
on:
  pull_request:
    types: [opened]
outputs:
  add-label: true
  add-comment: { max: 1 }
---
Initial review. Add "ready-for-detailed-review" when satisfied.

---
# Separate agent
name: PR Detailed Review
on:
  pull_request:
    types: [labeled]
trigger_labels:
  - ready-for-detailed-review
outputs:
  add-comment: { max: 1 }
  add-label: true
---
Detailed code review. Remove "ready-for-detailed-review" when complete.
```

**3. Rate Limiting to Prevent Cascades:**

```yaml
---
name: Quick Response Agent
rate_limit_minutes: 5  # Prevent rapid re-triggering
on:
  issues:
    types: [labeled]
---
Fast response but rate-limited to prevent loops.
```

**4. Mutual Exclusion Pattern:**

```yaml
---
name: Agent A
trigger_labels:
  - track-a
exclude_labels:
  - track-b
---
Only runs on track-a, never when track-b is present.

---
name: Agent B
trigger_labels:
  - track-b
exclude_labels:
  - track-a
---
Only runs on track-b, never when track-a is present.
```

## Cost Optimization Strategies

Minimize Claude API usage while maintaining agent effectiveness.

### Input Filtering

Use the `inputs` field to only trigger agents when relevant data exists:

```yaml
---
name: Weekly Issue Summary
on:
  schedule:
    - cron: '0 9 * * MON'
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
inputs:
  issues:
    states: [open, closed]
    limit: 100
  pull_requests:
    states: [merged]
    limit: 50
  since: '7d'  # Last 7 days
  min_items: 5  # Skip if fewer than 5 total items
---

Create weekly summary only if there's meaningful activity.
```

**Available time filters:**
- `last-run`: Since last successful workflow run (default)
- `1h`, `6h`, `12h`, `24h`: Hours ago
- `7d`, `14d`, `30d`: Days ago

**Minimum items threshold:**
```yaml
inputs:
  issues:
    states: [open]
  min_items: 10  # Don't run agent if fewer than 10 issues
```

### Token Optimization

**1. Concise Instructions:**

```yaml
# Less efficient
---
markdown instructions...
Please analyze the issue carefully, taking into account all the context
provided, including the full description, any comments, the labels that
have been applied, and any other relevant information...

# More efficient
---
markdown instructions...
Analyze issue: description, labels, comments. Categorize as bug/feature/question.
Add priority label. Comment with assessment.
```

**2. Use Lower Token Limits:**

```yaml
claude:
  max_tokens: 1024  # Sufficient for simple tasks
  temperature: 0.3  # More focused, less exploration
```

**3. Limit Output Actions:**

```yaml
outputs:
  add-comment: { max: 1 }  # Prevent multiple API calls
  add-label: true          # Single operation
```

### Selective Triggering

**Path Filtering:**

```yaml
on:
  pull_request:
    types: [opened]
    paths:
      - 'src/**'      # Only source code
      - '!src/test/**' # Exclude tests
```

**Event Type Filtering:**

```yaml
on:
  issues:
    types: [opened]  # Not edited, commented, etc.
```

**Team/User Restrictions:**

```yaml
allowed-teams:
  - core-contributors
# Agent only runs for team members, reducing noise
```

### Batch Processing

Process multiple items in one run instead of per-item:

```yaml
---
name: Daily Stale Issue Check
on:
  schedule:
    - cron: '0 10 * * *'
permissions:
  issues: write
outputs:
  add-label: true
  add-comment: { max: 20 }  # Multiple issues
inputs:
  issues:
    states: [open]
    limit: 100
  since: '60d'
---

Check all collected issues at once. For each stale issue:
1. Add "stale" label
2. Post warning comment

Process up to 20 issues in one agent run instead of 20 separate runs.
```

## Advanced Input Filtering and Collection

The `inputs` field provides powerful data collection before agent execution.

### Input Types Overview

```yaml
inputs:
  # Issues with filters
  issues:
    states: [open, closed, all]
    labels: [bug, feature]
    exclude_labels: [wontfix]
    assignees: [username]
    creators: [username]
    milestones: [v1.0]
    limit: 100

  # Pull requests with filters
  pull_requests:
    states: [open, closed, merged, all]
    labels: [ready-for-review]
    exclude_labels: [wip]
    assignees: [username]
    creators: [username]
    reviewers: [username]
    base_branch: main
    head_branch: feature/*
    limit: 50

  # Discussions
  discussions:
    categories: [Q&A, Ideas]
    answered: true
    unanswered: false
    labels: [help-wanted]
    limit: 25

  # Commits
  commits:
    branches: [main, develop]
    authors: [username]
    exclude_authors: [bot-user]
    limit: 50

  # Releases
  releases:
    prerelease: true
    draft: false
    limit: 10

  # Workflow runs
  workflow_runs:
    workflows: [ci.yml, deploy.yml]
    status: [failure, success]
    branches: [main]
    limit: 25

  # Repository stats
  stars: true
  forks: true

  # Time filter (applies to all)
  since: last-run  # or 1h, 24h, 7d, etc.
  min_items: 1     # Minimum total items to run
```

### Complex Filtering Examples

**Monitor Failed Deployments:**

```yaml
---
name: Deployment Failure Notifier
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
inputs:
  workflow_runs:
    workflows: [deploy-production.yml]
    status: [failure]
    branches: [main]
    limit: 10
  since: last-run
  min_items: 1
---

If any production deployment failed since last check:
1. Analyze failure logs
2. Identify likely cause
3. Create high-priority issue with details
4. Tag relevant team members
```

**Community Health Metrics:**

```yaml
---
name: Community Engagement Report
on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
inputs:
  issues:
    states: [open, closed]
    limit: 500
  pull_requests:
    states: [all]
    limit: 200
  discussions:
    limit: 100
  stars: true
  forks: true
  since: 30d
---

Generate monthly community health report:
- New contributors
- Issue resolution rate
- PR merge rate
- Discussion activity
- Star/fork growth
- Top contributors
```

**Abandoned PR Detector:**

```yaml
---
name: Abandoned PR Detector
on:
  schedule:
    - cron: '0 12 * * MON'
permissions:
  pull_requests: write
outputs:
  add-comment: { max: 10 }
  add-label: true
inputs:
  pull_requests:
    states: [open]
    exclude_labels: [wip, on-hold]
    limit: 100
  since: 14d  # No updates in 2 weeks
  min_items: 1
---

For each PR without updates in 14 days:
1. Check if waiting on author or reviewer
2. Add "needs-attention" label
3. Post gentle reminder comment
4. Tag appropriate people
```

## Working with allowed-paths Patterns

Control file modification scope with glob patterns.

### Pattern Examples

```yaml
# Specific files
allowed-paths:
  - README.md
  - CHANGELOG.md

# Directory and all contents
allowed-paths:
  - docs/**

# File types across repository
allowed-paths:
  - "**/*.md"

# Multiple directories
allowed-paths:
  - src/docs/**
  - examples/**
  - "*.md"

# Complex patterns
allowed-paths:
  - docs/**/*.md         # Only markdown in docs
  - "!docs/archive/**"   # Except archived docs
  - src/types/**/*.ts    # TypeScript types only
```

### Security Patterns

**Documentation-Only Agent:**

```yaml
allowed-paths:
  - docs/**
  - "*.md"
  - "!.github/**"  # Never modify workflows
```

**Configuration Updates:**

```yaml
allowed-paths:
  - package.json
  - tsconfig.json
  - .github/claude.yml
  - "!.github/workflows/**"  # Never workflows
```

**Safe Testing Agent:**

```yaml
allowed-paths:
  - tests/**
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "!src/**"  # Never production code
```

## Team-Based Access Control

Restrict agents to specific users, teams, or actors.

### Access Control Patterns

**Team-Only Access:**

```yaml
---
name: Privileged Operation
allowed-teams:
  - core-team
  - security-team
permissions:
  contents: write
---
Only members of specified teams can trigger this agent.
```

**Specific User List:**

```yaml
---
name: Admin Agent
allowed-actors:
  - alice
  - bob
  - carol
---
Only explicitly listed users can trigger.
```

**Combined Restrictions:**

```yaml
---
name: Secure Agent
allowed-teams:
  - maintainers
allowed-actors:
  - trusted-bot
allowed-paths:
  - .github/claude-agents/**
---
Requires team membership OR specific user.
Can only modify agent definitions.
```

### Dynamic Authorization

Let the agent check permissions:

```yaml
---
name: Smart Authorization
on:
  issues:
    types: [labeled]
trigger_labels:
  - admin-request
permissions:
  issues: write
---

Before taking action:
1. Check if issue author is in allowed teams (use GitHub API)
2. Verify they have necessary repository permissions
3. If authorized, proceed with requested action
4. If not, add comment explaining access requirements
```

## Rate Limiting Strategies

Prevent excessive runs and API usage.

### Rate Limiting Patterns

**Aggressive Rate Limit:**

```yaml
rate_limit_minutes: 60  # Max once per hour
on:
  issues:
    types: [opened, edited, commented]
```

**Moderate Rate Limit:**

```yaml
rate_limit_minutes: 5  # Max once per 5 minutes
```

**No Rate Limit:**

```yaml
rate_limit_minutes: 0  # Allow every trigger
# Use cautiously!
```

### Use Case Based Limits

**Expensive Operations:**

```yaml
---
name: Full Repository Audit
rate_limit_minutes: 1440  # Once per 24 hours max
on:
  workflow_dispatch: {}
  schedule:
    - cron: '0 0 * * *'  # Daily
---
Heavy analysis that shouldn't run frequently.
```

**Real-Time Response:**

```yaml
---
name: Security Alert
rate_limit_minutes: 0  # No limit
trigger_labels:
  - security
  - vulnerability
---
Critical issues need immediate response.
```

**Batch Processing:**

```yaml
---
name: Issue Cleanup
rate_limit_minutes: 360  # 6 hours
on:
  schedule:
    - cron: '0 */6 * * *'
inputs:
  issues:
    states: [open]
  min_items: 10
---
Periodic cleanup, not time-sensitive.
```

## Testing and Development Workflow

Strategies for developing and testing agents safely.

### Development Workflow

**1. Start with workflow_dispatch:**

```yaml
---
name: New Agent (Testing)
on:
  workflow_dispatch: {}  # Manual only during development
  # issues:
  #   types: [opened]    # Enable after testing
permissions:
  issues: read  # Start read-only
outputs:
  # Start with no outputs, just logging
---
Test agent logic safely before enabling automated triggers.
```

**2. Use Dry-Run Pattern:**

```yaml
---
name: Testing Agent
on:
  workflow_dispatch:
    inputs:
      dryRun:
        description: 'Dry run mode'
        type: boolean
        default: true
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
---

**DRY RUN MODE: {{ inputs.dryRun }}**

If dry run is true:
- Analyze and log what you WOULD do
- Add comment explaining planned actions
- DO NOT actually modify anything

If dry run is false:
- Execute actual operations
```

**3. Gradual Permission Escalation:**

```yaml
# Phase 1: Read-only
permissions:
  issues: read

# Phase 2: Add comments only
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }

# Phase 3: Full operations
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
  close-issue: true
```

### Testing Checklist

- [ ] Test with workflow_dispatch manually
- [ ] Verify agent handles missing data gracefully
- [ ] Check rate limiting works as expected
- [ ] Test with minimum items threshold
- [ ] Validate all output actions work correctly
- [ ] Review generated workflow YAML
- [ ] Test access control (if using allowed-teams/actors)
- [ ] Verify path restrictions work (if using allowed-paths)
- [ ] Check agent stops when expected (min_items)
- [ ] Monitor API usage and costs

### Local Testing

```bash
# Validate agent definition
gh claude validate .github/claude-agents/my-agent.md --strict

# Compile and review workflow
gh claude compile .github/claude-agents/my-agent.md --dry-run

# List all agents
gh claude list

# Test compilation of all agents
gh claude compile --all --dry-run
```

## CI/CD Integration Patterns

Integrate gh-claude into your development pipeline.

### Auto-Compile on PR

```yaml
# .github/workflows/compile-agents.yml
name: Compile Claude Agents
on:
  pull_request:
    paths:
      - '.github/claude-agents/**'

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup gh-claude
        run: gh extension install lucasilverentand/gh-claude

      - name: Validate agents
        run: gh claude validate --all --strict

      - name: Compile workflows
        run: gh claude compile --all

      - name: Commit compiled workflows
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .github/workflows/
          git diff --staged --quiet || git commit -m "chore: compile claude agents"
          git push
```

### Pre-Commit Validation

```yaml
# .github/workflows/validate-agents.yml
name: Validate Agents
on:
  pull_request:
    paths:
      - '.github/claude-agents/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install gh-claude
        run: gh extension install lucasilverentand/gh-claude

      - name: Validate all agents
        run: gh claude validate --all --strict

      - name: Check for issues
        run: |
          if ! gh claude validate --all --strict; then
            echo "❌ Agent validation failed"
            exit 1
          fi
          echo "✅ All agents valid"
```

### Automated Testing

```yaml
# .github/workflows/test-agents.yml
name: Test Agents
on:
  pull_request:
    paths:
      - '.github/claude-agents/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test agent compilation
        run: |
          gh extension install lucasilverentand/gh-claude
          gh claude compile --all --dry-run > /tmp/compiled.yml

      - name: Validate workflow syntax
        run: |
          # Use actionlint or similar to validate generated YAML
          npm install -g actionlint
          actionlint .github/workflows/claude-*.yml
```

## Performance Optimization Tips

### 1. Use Specific Triggers

```yaml
# Less efficient - runs on every comment
on:
  issue_comment:
    types: [created]

# More efficient - only specific labels
on:
  issues:
    types: [labeled]
trigger_labels:
  - needs-review
```

### 2. Batch Operations

```yaml
# Less efficient - per-issue agent
on:
  issues:
    types: [opened]

# More efficient - batch processing
on:
  schedule:
    - cron: '0 * * * *'  # Hourly batch
inputs:
  issues:
    states: [open]
    since: last-run
```

### 3. Smart Caching with since: last-run

```yaml
inputs:
  issues:
    states: [open, closed]
  pull_requests:
    states: [all]
  since: last-run  # Only new items since last successful run
  min_items: 1     # Skip if nothing new
```

### 4. Optimize Claude Configuration

```yaml
claude:
  model: claude-3-5-sonnet-20241022  # Balanced
  # model: claude-3-haiku-20240307   # Faster/cheaper for simple tasks
  max_tokens: 1024                    # Lower for simple tasks
  temperature: 0.3                     # More deterministic
```

### 5. Limit Permissions

```yaml
# Less efficient - more validation overhead
permissions:
  contents: write
  issues: write
  pull_requests: write
  discussions: write

# More efficient - minimal permissions
permissions:
  issues: write
```

## Next Steps

- Review [Quick Reference](../../reference/quick-reference/) for field lookup
- Check [Examples](../../examples/issue-triage/) for complete patterns
- Learn about [Security](../../reference/security/) best practices
