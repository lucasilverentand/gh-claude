---
title: Troubleshooting
description: Common issues and debugging techniques for gh-claude
---

This guide helps you diagnose and fix common problems with gh-claude agents.

## Common Workflow Failures

### Agent Not Triggering

When your agent doesn't run on expected events:

**Check the compiled workflow exists:**

```bash
ls -la .github/workflows/
```

Your agent should have a corresponding `claude-*.yml` file. If missing:

```bash
gh claude compile --all
git add .github/workflows/
git commit -m "Add compiled workflows"
git push
```

**Verify GitHub Actions are enabled:**

1. Go to your repository Settings > Actions > General
2. Ensure "Allow all actions and reusable workflows" is selected
3. Check that workflows have read/write permissions if your agent needs them

**Check trigger configuration:**

Review your agent's `on:` section matches the events you expect:

```yaml
on:
  issues:
    types: [opened]  # Only triggers on NEW issues, not edits
  pull_request:
    types: [opened, synchronize]  # Triggers on new PRs and updates
```

**Verify trigger labels (if configured):**

If your agent has `trigger_labels`, the issue/PR must have one of those labels:

```yaml
trigger_labels:
  - claude
  - ai-review
```

The workflow will skip if none of these labels are present.

### Workflow Shows "Skipped"

**Pre-flight validation failed:**

Go to Actions tab > select the workflow run > expand "pre-flight" job to see which validation failed:

- **Secret validation**: Missing `ANTHROPIC_API_KEY` secret
- **User authorization**: User doesn't have required permissions
- **Label check**: Required label not present
- **Rate limit**: Agent ran too recently

**Input collection returned no data:**

For agents with `inputs:` configuration, check the "collect-inputs" job:

```yaml
inputs:
  issues:
    states: [open]
  since: 24h
  min_items: 1  # Agent skips if fewer than 1 item collected
```

If no matching data is found in the time window, the workflow skips to save API costs.

### Pre-flight Job Failures

#### Secret Validation Errors

**Error: No Claude authentication found**

The workflow needs either `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`:

```bash
# Set the API key
gh secret set ANTHROPIC_API_KEY
```

When prompted, paste your API key from [Anthropic Console](https://console.anthropic.com/).

**Verify the secret exists:**

```bash
gh secret list
```

#### User Authorization Errors

**Warning: User @username is not authorized**

By default, only users with admin/write permissions or org members can trigger agents.

**To allow specific users:**

```yaml
allowed_actors:
  - github-username
  - another-user
```

**To allow team members:**

```yaml
allowed_teams:
  - core-team
  - maintainers
```

**Debug permission issues:**

Check user's permission level:

```bash
gh api repos/OWNER/REPO/collaborators/USERNAME/permission
```

#### Rate Limit Errors

**Warning: Agent ran X minutes ago. Minimum interval is Y minutes**

Agents have a default 5-minute cooldown between runs. Either:

1. Wait for the cooldown period
2. Adjust the rate limit in your agent:

```yaml
rate_limit_minutes: 1  # Reduce to 1 minute (use carefully)
```

3. Manually trigger with workflow_dispatch (bypasses some checks)

### Claude Agent Job Failures

#### Installation Failures

**Error: Failed to install Claude Code CLI**

Check the "Install Claude Code CLI" step output. Usually caused by:

- Network issues (retry the workflow)
- npm registry problems (temporary, retry later)

**Temporary fix - manual installation:**

Contact support if the issue persists.

#### Context Preparation Failures

**Error in "Prepare context file" step:**

Usually indicates malformed GitHub event data. Check:

- The event payload in the workflow run
- Your trigger configuration matches the actual event

#### Claude Execution Failures

**Error: Claude API returned error**

Check the "Run Claude agent" step for the actual error:

- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Too many API requests
- **500 Server Error**: Anthropic API issue (retry)

**Error: Invalid output format**

Claude generated output that doesn't match the expected JSON schema. This can happen if:

- Instructions are unclear about output format
- Model is using too low temperature (increase to 0.7)
- Context is too large (reduce input limits)

### Output Execution Failures

#### Permission Denied Errors

**Error: Resource not accessible by integration**

The `GITHUB_TOKEN` lacks required permissions. Add to your agent:

```yaml
permissions:
  issues: write        # For commenting on issues
  pull_requests: write # For PR operations
  contents: write      # For file modifications
```

#### File Update Failures

**Error: Path not in allowed_paths**

File modifications require explicit path allowlisting:

```yaml
allowed_paths:
  - docs/**
  - README.md

outputs:
  update_file: true
```

**Error: Commit signature failed**

If using `sign: true`:

```yaml
outputs:
  create_pr: { sign: true }
```

Ensure you have commit signing configured in your repository settings.

#### Comment/Label Failures

**Error: Issue/PR not found**

Verify the workflow is triggered by the correct event:

```yaml
on:
  issues:           # For issue operations
    types: [opened]
  pull_request:     # For PR operations
    types: [opened]
```

**Error: Maximum output limit exceeded**

You've hit the configured limit:

```yaml
outputs:
  add_comment: { max: 1 }  # Only 1 comment allowed
```

Either increase the limit or review why multiple outputs were generated.

## Input Collection Failures

### No Data Collected

**Agent always skips with inputs configured:**

1. Check the "collect-inputs" job logs
2. Verify your time filter isn't too restrictive:

```yaml
inputs:
  issues:
    states: [open]
  since: 1h  # Only last hour - might be too narrow
  min_items: 1
```

Try a wider time window:

```yaml
since: 24h  # Last 24 hours
```

3. Verify filters match actual data:

```yaml
inputs:
  issues:
    labels: [bug]  # Only issues with 'bug' label
    states: [open]
```

**Check if matching data exists:**

```bash
gh issue list --label bug --state open
```

### Time Filter Issues

**Error: Invalid date format**

The collection script handles both GNU and BSD `date` commands, but if you see date errors:

- Check the "collect-inputs" job output
- Verify the `since` value is valid: `last-run`, `1h`, `24h`, `7d`, `30d`

**`last-run` returns no data:**

On first run, `last-run` defaults to 24 hours. Subsequent runs use the last successful run time.

### GraphQL/API Errors

**Error: Could not resolve to a Repository**

Usually a permissions issue. Ensure:

- Repository exists and workflow has access
- For private repos, verify GitHub App permissions

**Error: API rate limit exceeded**

Reduce the `limit` in your input configuration:

```yaml
inputs:
  issues:
    limit: 50  # Reduce from default 100
  pull_requests:
    limit: 50
```

## Debugging Techniques

### Reading GitHub Actions Logs

**Navigate to detailed logs:**

1. Go to repository > Actions tab
2. Click the failed workflow run
3. Expand each job to see steps
4. Click on a failed step to see full output

**Key jobs to check:**

- **pre-flight**: Validation failures
- **collect-inputs**: Data collection issues (if using inputs)
- **claude-agent**: Claude execution and output generation
- **execute-outputs**: GitHub API operations

### Finding Claude's Output

**View what Claude generated:**

1. Go to workflow run > "claude-agent" job
2. Find "Run Claude agent" step
3. Scroll through output to see Claude's responses
4. Look for JSON output files in subsequent steps

**Check output files:**

The workflow creates files in `/tmp/outputs/`:

- `add-comment.json`
- `add-label.json`
- `create-issue.json`
- etc.

View these in the "execute-outputs" job steps.

### Viewing Event Context

**See what triggered the workflow:**

In the workflow run, expand the first step to see:

```
GitHub Event: issues
Repository: owner/repo
Trigger: opened
```

**View full event payload:**

GitHub provides the event payload in the Actions logs. Look for:

```json
{
  "action": "opened",
  "issue": {
    "number": 123,
    "title": "Issue title",
    ...
  }
}
```

### Testing Locally Before Committing

**Validate agent definition:**

```bash
gh claude validate .github/claude-agents/my-agent.md
```

**Strict validation (warnings as errors):**

```bash
gh claude validate --all --strict
```

**See generated workflow without committing:**

```bash
gh claude compile --dry-run my-agent.md
```

This shows exactly what would be generated.

**Check what would change:**

```bash
gh claude compile --dry-run --all > /tmp/preview.yml
diff .github/workflows/claude-my-agent.yml /tmp/preview.yml
```

### Manual Workflow Triggers

**Test agent manually:**

Add workflow_dispatch to your agent:

```yaml
on:
  issues:
    types: [opened]
  workflow_dispatch:  # Enables manual triggering
```

Recompile and push, then:

1. Go to Actions tab
2. Select your workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

This bypasses event-based triggers for testing.

### Viewing Validation Logic

**Understand why validation failed:**

Check the generated workflow file directly:

```bash
cat .github/workflows/claude-my-agent.yml
```

Look at the `pre-flight` job's bash scripts to see exact validation logic.

## Common Compilation Errors

### Validation Failures

**Error: Field 'name' is required**

Add name to frontmatter:

```yaml
---
name: My Agent
---
```

**Error: Field 'on' is required**

Add at least one trigger:

```yaml
---
name: My Agent
on:
  issues:
    types: [opened]
---
```

**Error: update-file requires allowed_paths**

Add path restrictions:

```yaml
allowed_paths:
  - docs/**
outputs:
  update_file: true
```

**Error: create-pr requires contents: write permission**

Add required permission:

```yaml
permissions:
  contents: write
outputs:
  create_pr: true
```

### YAML Syntax Errors

**Error: Unexpected token**

Check YAML frontmatter syntax:

```yaml
---
name: Agent Name
on:
  issues:          # Correct indentation
    types: [opened]
permissions:       # No extra spaces
  issues: write
---
```

**Error: Invalid output configuration**

Output config must be `true` or an object:

```yaml
# Valid:
outputs:
  add_comment: true
  add_label: { max: 5 }

# Invalid:
outputs:
  add_comment: 1        # Use true or { max: 1 }
```

### Markdown Parsing Errors

**Error: No markdown content found**

Ensure you have content after frontmatter:

```yaml
---
name: My Agent
on:
  issues:
    types: [opened]
---

# Agent Instructions

Your instructions go here.
```

**Error: Invalid frontmatter**

Frontmatter must be valid YAML between `---` markers:

```yaml
---
# This is valid YAML frontmatter
name: My Agent
---

Agent instructions start here.
```

## Cost and Rate Limiting

### Managing API Costs

**Monitor token usage:**

Check workflow logs for token consumption:

```
Claude API call: 1,234 tokens input, 567 tokens output
```

**Reduce costs:**

1. Use smaller model:

```yaml
claude:
  model: claude-3-haiku-20240307  # Cheaper than Sonnet
```

2. Limit max_tokens:

```yaml
claude:
  max_tokens: 2048  # Reduce from default 4096
```

3. Use input filtering:

```yaml
inputs:
  issues:
    limit: 20     # Reduce data collected
  since: 1h       # Narrow time window
  min_items: 5    # Only run if significant activity
```

4. Increase rate limiting:

```yaml
rate_limit_minutes: 60  # Run max once per hour
```

### Anthropic API Rate Limits

**Error: Rate limit exceeded (429)**

You've hit Anthropic's API rate limits. Solutions:

1. **Immediate**: Wait a few minutes and retry
2. **Short-term**: Increase `rate_limit_minutes` in agents
3. **Long-term**: Contact Anthropic to increase rate limits

**Check your current usage:**

Visit [Anthropic Console](https://console.anthropic.com/) to see:

- Current rate limits
- Usage statistics
- Billing information

## Getting More Help

### Enable Debug Logging

**For GitHub Actions:**

Set repository secret:

```bash
gh secret set ACTIONS_STEP_DEBUG --body "true"
```

This enables verbose logging for all workflow steps.

### Check Agent Definition

**List all agents:**

```bash
gh claude list --details
```

**View specific agent config:**

```bash
cat .github/claude-agents/my-agent.md
```

**Compare with examples:**

```bash
gh claude init --examples
ls -la .github/claude-agents/examples/
```

### Report Issues

If you've tried troubleshooting and still have problems:

1. **Check existing issues**: Search the [issue tracker](https://github.com/lucasilverentand/gh-claude/issues)
2. **Gather information**:
   - Agent markdown file
   - Generated workflow file
   - Workflow run logs
   - Error messages
3. **Open an issue** with:
   - Clear description of expected vs actual behavior
   - Steps to reproduce
   - Relevant logs and configuration

### Common "Won't Fix" Scenarios

Some behaviors are intentional:

- **Validation failures are strict**: This is a security feature
- **Rate limiting prevents spam**: Protects against runaway agents
- **Output limits are enforced**: Prevents abuse and cost overruns
- **Path restrictions are mandatory**: Prevents accidental file corruption

## Quick Reference

### Debugging Checklist

- [ ] Agent markdown file exists in `.github/claude-agents/`
- [ ] Workflow compiled successfully (`gh claude compile`)
- [ ] Workflow file exists in `.github/workflows/`
- [ ] Changes committed and pushed to GitHub
- [ ] GitHub Actions enabled in repository settings
- [ ] `ANTHROPIC_API_KEY` secret configured
- [ ] Trigger configuration matches the event
- [ ] Required labels present (if configured)
- [ ] User has required permissions
- [ ] Rate limit cooldown passed
- [ ] Permissions specified in frontmatter
- [ ] Outputs configured if agent should take actions

### Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Agent not triggering | `gh claude compile --all && git push` |
| Secret not found | `gh secret set ANTHROPIC_API_KEY` |
| Validation errors | `gh claude validate --all --strict` |
| See what would generate | `gh claude compile --dry-run --all` |
| Permission denied | Add required permissions to frontmatter |
| Rate limited | Increase `rate_limit_minutes` or wait |
| No inputs collected | Widen `since` time window or reduce `min_items` |

## Related Documentation

- [Agent Definition](agent-definition/) - Frontmatter reference
- [Outputs](outputs/) - Available actions
- [Permissions](permissions/) - Permission requirements
- [Security](../../reference/security/) - Security best practices
- [Configuration](../../reference/configuration/) - Repository configuration
