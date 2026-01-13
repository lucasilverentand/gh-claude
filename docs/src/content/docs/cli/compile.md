---
title: gh claude compile
description: Compile agent markdown files to GitHub Actions workflows
---

The `compile` command converts all Claude agent markdown files into GitHub Actions workflow YAML files, including a centralized dispatcher workflow that handles routing and validation.

## Usage

```bash
gh claude compile [options]
```

## Options

### `-d, --dry-run`

Show what would be generated without writing files:

```bash
gh claude compile --dry-run
```

This outputs:
- The dispatcher workflow YAML
- All agent workflow YAMLs

### `-o, --output-dir DIR`

Specify custom output directory for workflows:

```bash
gh claude compile --output-dir custom/workflows
```

Default: `.github/workflows/`

## How It Works

The compile command processes all agents in `.github/claude-agents/` and generates:

1. **Dispatcher workflow** (`claude-dispatcher.yml`)
   - Aggregates all triggers from all agents
   - Performs shared pre-flight validation (secrets, GitHub App)
   - Self-heals by creating issues if misconfigured
   - Routes events to matching agent workflows

2. **Agent workflows** (`claude-{agent-name}.yml`)
   - Each agent gets its own workflow
   - Triggered by the dispatcher via `workflow_call`
   - Receives event context from dispatcher
   - Performs agent-specific validation and execution

## Examples

### Compile All Agents

```bash
gh claude compile
```

Output:
```
✔ Found 3 agent file(s)
✔ Parsed issue-triage.md
✔ Parsed pr-review.md
✔ Parsed daily-report.md
✔ Generated dispatcher workflow
✔ Generated Issue Triage workflow
✔ Generated PR Review workflow
✔ Generated Daily Report workflow

Compilation Summary:
  ✓ Agents: 3
  ✓ Dispatcher: 1

Workflows generated successfully!
```

### Preview Changes (Dry Run)

```bash
gh claude compile --dry-run
```

Shows the complete YAML output without writing files.

## Generated Files

After running `compile`, you'll have:

```
.github/workflows/
├── claude-dispatcher.yml         # Central dispatcher
├── claude-issue-triage.yml       # Agent workflow
├── claude-pr-review.yml          # Agent workflow
└── claude-daily-report.yml       # Agent workflow
```

## The Dispatcher Pattern

The dispatcher is a centralized workflow that provides:

### Trigger Aggregation
All agent triggers are combined into one workflow:
```yaml
on:
  issues: { types: [opened, labeled] }
  pull_request: { types: [opened, synchronize] }
  schedule: [{ cron: '0 9 * * 1-5' }]
  workflow_dispatch: {}
```

### Pre-Flight Validation
Before running any agent, the dispatcher:
- Checks Claude API authentication
- Generates GitHub App token (if configured)
- Validates permissions

### Self-Healing
If configuration is invalid, the dispatcher:
1. Creates a detailed GitHub issue with fix instructions
2. Disables itself to prevent repeated failures
3. Waits for you to fix and re-enable

### Event Routing
The dispatcher uses a routing table to match events to agents:
- Issue opened → Issue Triage agent
- PR opened → PR Review agent
- Schedule (9 AM) → Daily Report agent

### Context Passing
Event context is passed to agents via artifacts:
- Issue/PR number, title, body, labels
- Trigger type and action
- Repository info, actor, timestamps

## Validation

The compile command automatically validates agents before generating workflows:

```
✔ Parsing agent files...
✔ Validating configurations...
✔ Checking permissions...
✔ Validating output handlers...
```

If validation fails, you'll see detailed error messages:

```
✗ Failed to parse issue-triage.md
  ✗ on: Missing required field
  ✗ permissions: 'update-file' requires 'contents: write'
```

Fix the errors and run compile again.

## Best Practices

### 1. Validate Before Compiling

Run validation separately to catch errors early:

```bash
gh claude validate --all
gh claude compile
```

### 2. Use Dry Run for Review

Preview changes before committing:

```bash
gh claude compile --dry-run | less
```

### 3. Commit All Generated Files

Always commit both the dispatcher and agent workflows:

```bash
git add .github/workflows/
git commit -m "Update Claude agent workflows"
```

### 4. Monitor the Dispatcher

After pushing, check the Actions tab to ensure the dispatcher is enabled and configured correctly.

## Troubleshooting

### "No agent files found"

Ensure you have `.md` files in `.github/claude-agents/`:

```bash
ls .github/claude-agents/
```

### "Validation failed"

Run validate command for detailed errors:

```bash
gh claude validate --all
```

### Generated workflows look wrong

Try cleaning and regenerating:

```bash
rm .github/workflows/claude-*.yml
gh claude compile
```

## Next Steps

- [Validate](../validate/) agents before compiling
- [List](../list/) all agents
- Learn about [Agent Definition](/gh-claude/guide/agent-definition/)
- Understand [How It Works](/gh-claude/guide/how-it-works/) with dispatcher architecture

## See It In Action

- [Issue Triage Example](/gh-claude/examples/issue-triage/) - Complete agent workflow
- [Daily Summary Example](/gh-claude/examples/daily-summary/) - Scheduled agent with inputs

## See Also

- [Testing Strategies](/gh-claude/guide/testing-strategies/) - Safe development workflow
- [Troubleshooting](/gh-claude/guide/troubleshooting/) - Common issues
- [Agent Execution Flow](/gh-claude/guide/agent-execution-flow/) - Detailed workflow stages
