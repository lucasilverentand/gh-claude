---
title: How It Works
description: Understanding what happens when you use gh-claude
---

This guide explains what happens when you run gh-claude commands and when your agents execute in GitHub Actions.

## From Markdown to Running Workflow

gh-claude transforms your markdown files into GitHub Actions workflows. Here's what you'll see:

### 1. Writing Your Agent

You create a markdown file in `.github/claude-agents/`:

```markdown
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

Analyze new issues and add appropriate labels...
```

### 2. Compiling to Workflow

When you run:

```bash
gh claude compile --all
```

You'll see:
- Validation messages confirming your agent configuration is correct
- A new workflow file created in `.github/workflows/claude-issue-triage.yml`
- Success message showing the compiled workflow

If there are errors, you'll see specific messages about what needs to be fixed (missing fields, invalid permissions, etc.).

### 3. Pushing to GitHub

After compiling, commit and push the workflow:

```bash
git add .github/workflows/
git commit -m "Add issue triage agent"
git push
```

The workflow is now active and waiting for triggers.

## When Your Agent Runs

When a trigger event occurs (like opening an issue), here's what happens:

### Step 1: Pre-Flight Checks (5-10 seconds)

GitHub Actions runs safety checks:

**What you'll see in the Actions log:**
- Checking for API authentication secrets
- Verifying the user who triggered the event has permission
- Checking if required labels are present (if configured)
- Verifying rate limits haven't been exceeded

**Possible outcomes:**
- All checks pass: workflow continues
- Checks fail: workflow stops with a clear message explaining why

**Where to look:** Actions tab, "pre-flight" job

### Step 2: Collecting Data (10-30 seconds, if configured)

If your agent has `inputs` configured, GitHub queries your repository for relevant data:

**What you'll see:**
- GitHub API calls fetching issues, PRs, discussions, etc.
- Time range calculations based on your `since` setting
- Filtering by labels, states, or other criteria
- Count of items collected

**Possible outcomes:**
- Enough data collected: continues to Claude
- Below `min_items` threshold: stops to save API costs with an info message

**Where to look:** Actions tab, "collect-inputs" job

### Step 3: Claude Analyzes (30-120 seconds)

The main execution where Claude reads your repository and generates responses:

**What you'll see:**
- Repository checkout
- Claude Code CLI installation
- Context file creation (your instructions + GitHub data)
- Claude analyzing the context
- Claude's responses and reasoning
- Output files being created (if outputs configured)

**What Claude receives:**
- Your agent's instructions
- The GitHub event that triggered the workflow
- Collected data from Step 2 (if any)
- Access to read repository files

**What Claude can do:**
- Read repository files (README, code, docs)
- Search for patterns across your codebase
- Analyze the issue/PR content
- Write output files (for actions like commenting or labeling)

**Where to look:** Actions tab, "claude-agent" job

### Step 4: Executing Outputs (5-15 seconds per output, if configured)

If your agent produced outputs (comments, labels, etc.), GitHub validates and executes them:

**What you'll see:**
- Validation of each output file
- GitHub API calls to perform actions
- Success or error messages for each action
- Results saved for reporting

**Possible outcomes:**
- Valid outputs: actions executed (comment posted, label added, etc.)
- Invalid outputs: error message and workflow fails

**Where to look:** Actions tab, "execute-outputs" job (may have multiple parallel instances)

### Step 5: Results Summary (5-10 seconds, if outputs configured)

Final reporting of what happened:

**What you'll see:**
- Summary of all actions taken
- Any errors that occurred
- Comment posted on issue/PR with results (if errors occurred)

**Where to look:** Actions tab, "report-results" job, or as a comment on your issue/PR

## Typical Timeline

From trigger to completion:

```
Event triggers → Pre-flight (10s) → Data collection (20s) → Claude (60s) → Outputs (10s) → Done

Total: ~2 minutes for most agents
```

Factors that affect timing:
- Claude processing complexity (more analysis = more time)
- Amount of data collected (more inputs = more time)
- Number of outputs (more actions = more time)
- API response times

## What You See in GitHub

### In the Actions Tab

1. **Workflow run list**: One entry per trigger event
2. **Run details**: Click to see all jobs
3. **Job details**: Expand to see individual steps
4. **Step logs**: Click steps to see detailed output

**Tip:** Look for the "Run Claude agent" step to see Claude's reasoning and responses.

### In Issues/PRs

If your agent has outputs configured:
- Comments appear from GitHub Actions bot
- Labels are automatically added
- Status changes occur
- Links to workflow run for troubleshooting

### In Artifacts (Advanced)

Some jobs upload artifacts:
- Output files created by Claude
- Validation results
- Error logs

Access via: workflow run details → "Artifacts" section

## Common Execution Patterns

### Read-Only Agents

Agents without outputs just analyze and log:

```
Trigger → Validation → Data collection → Claude analyzes → Results logged
```

**Use cases:** Daily summaries, analysis reports, monitoring

### Interactive Agents

Agents that respond to events:

```
Trigger → Validation → Claude analyzes issue/PR → Posts comment/adds label
```

**Use cases:** Issue triage, PR review, welcoming new contributors

### Scheduled Agents

Agents that run on a schedule:

```
Cron trigger → Validation → Collect recent data → Claude summarizes → Post results
```

**Use cases:** Daily/weekly summaries, periodic reviews, cleanup tasks

## Security in Action

Every run enforces security:

**Pre-flight checks:**
- Only authorized users can trigger agents
- API credentials must exist
- Rate limits prevent spam

**During execution:**
- Claude can only read files (not execute code)
- Outputs are validated before execution
- Actions are logged for audit

**After execution:**
- All actions are visible in logs
- Failed validations stop execution
- Results are reported transparently

## Debugging Your Agent

### If Nothing Happens

1. Check Actions tab for workflow runs
2. If no runs appear: verify trigger configuration
3. If runs appear but skip: check pre-flight job for reason

### If Validation Fails

1. Go to Actions tab → failed run
2. Expand "pre-flight" job
3. Read error message (will tell you exactly what's missing)

### If Claude Doesn't Respond

1. Check "claude-agent" job logs
2. Look for API errors or authentication issues
3. Verify `ANTHROPIC_API_KEY` secret is set

### If Outputs Fail

1. Check "execute-outputs" job
2. Read validation errors
3. Verify permissions are configured correctly

**See [Troubleshooting](./troubleshooting/) for detailed debugging steps.**

## What Gets Logged

GitHub Actions logs everything:

**You can see:**
- All steps executed
- Output from each command
- Error messages and stack traces
- Timing information
- Artifact uploads/downloads

**You cannot see:**
- Your API key value (hidden in logs)
- Private repository file contents (unless in logs)

**Logs are retained for:** 90 days by default (configurable)

## Rate Limits and Costs

### GitHub Actions

- Free tier: 2,000 minutes/month for private repos
- Public repos: unlimited
- Typical agent run: 2-3 minutes

### Claude API

- Billed by Anthropic based on token usage
- Each run consumes tokens based on context size
- Visible in workflow logs: "X tokens input, Y tokens output"

**Cost optimization:**
- Use `min_items` to skip runs without enough data
- Increase `rate_limit_minutes` to reduce frequency
- Use smaller models for simple tasks

## Next Steps

Now that you understand what happens when agents run:

- Learn about [Inputs](./inputs/) to collect repository data
- Explore [Outputs](./outputs/) to take actions
- Review [Troubleshooting](./troubleshooting/) for common issues
- See [Examples](../examples/issue-triage/) in action
