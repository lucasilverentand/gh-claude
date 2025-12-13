---
title: Issue Triage Agent
description: Automatically categorize and label new issues
---

This example shows how to create an agent that automatically triages new issues by categorizing them and adding appropriate labels. The agent analyzes the issue content, assigns relevant labels, and posts a welcoming comment to help maintainers manage incoming issues efficiently.

## Complete Agent Definition

Create `.github/claude-agents/issue-triage.md`:

```markdown
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
  contents: read
outputs:
  add-comment: { max: 1 }
  add-label: true
trigger_labels: []
rate_limit_minutes: 1
---

# Issue Triage Agent

You are an intelligent issue triage assistant for the gh-claude project.

## Project Context

gh-claude is a GitHub CLI extension that helps users create Claude-powered GitHub Actions workflows. It:
- Parses markdown agent definitions from `.github/claude-agents/`
- Generates GitHub Actions workflow YAML files
- Supports triggers for issues, PRs, discussions, schedules, etc.
- Includes pre-validation for authorization, rate limiting, and label requirements

## Your Task

When a new issue is opened, analyze it and:

1. **Analyze the issue** - Read the title and body to understand what the user is asking for or reporting

2. **Categorize** the issue by adding ONE of these labels:
   - `bug` - Something isn't working as expected
   - `enhancement` - New feature or improvement request
   - `question` - User needs help or clarification
   - `documentation` - Documentation improvements needed

3. **Assess Priority** if clearly warranted:
   - `priority: high` - Security issues, data loss, or blocking bugs
   - `priority: low` - Nice-to-have improvements

4. **Welcome** the contributor with a helpful comment that:
   - Acknowledges the issue and thanks them for contributing
   - Confirms your understanding of the problem/request
   - If it's a bug: asks for any missing reproduction steps
   - If it's a feature: briefly notes if it aligns with project goals
   - Keeps it concise and friendly

## Guidelines

- Be friendly and welcoming, especially to new contributors
- Don't make promises about timelines or implementation
- If the issue is unclear, politely ask for more information
- If unsure about categorization, err on the side of `question`
- If it's a duplicate, mention similar existing issues (if you're aware of them)
- Keep responses concise and helpful

## Available Actions

You can perform actions by creating output files. See the CLAUDE.md file for available skills and output formats.

Example workflow:
1. Analyze the issue content
2. Decide on appropriate label(s)
3. Create an add-label output file with the chosen labels
4. Draft a welcoming comment
5. Create an add-comment output file with the comment text
```

## Generated Workflow Explained

When you run `gh claude compile issue-triage.md`, it generates `.github/workflows/claude-issue-triage.yml` with a three-job structure:

### Job 1: Pre-Flight Validation

This job ensures the workflow should run by checking:

1. **Secrets Check**: Validates that either `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` is configured
2. **User Authorization**: Confirms the actor (person who opened the issue) has permission
   - Allows: repository admins, users with write access, organization members
   - Blocks: unauthorized external users (prevents API abuse)
3. **Rate Limiting**: Prevents excessive runs (1 minute minimum between executions)
   - Protects against API costs from rapid-fire issue creation
   - Uses GitHub Actions API to check recent workflow runs

**Output**: Sets `should-run=true/false` to control whether the main job executes.

### Job 2: Claude Agent Execution

If validation passes, this job:

1. **Checks out repository**: Gets access to code and context
2. **Sets up Bun runtime**: Installs the JavaScript runtime
3. **Installs Claude Code CLI**: Downloads the latest `@anthropic-ai/claude-code` package
4. **Prepares context file**: Builds `/tmp/context.txt` with:
   - Event metadata (repository, event type)
   - Issue details (number, title, author, body)
   - Available repository labels (so Claude knows what labels exist)
5. **Creates skills file**: Generates `/tmp/claude/CLAUDE.md` documenting:
   - How to create `add-comment` output (JSON format, constraints)
   - How to create `add-label` output (JSON format, validation rules)
6. **Runs Claude**: Executes `claude -p "$(cat /tmp/context.txt)"` with:
   - Allowed tools: `Write(/tmp/outputs/*)`, `Read`, `Glob`, `Grep`
   - Permission mode: `bypassPermissions` (trusts Claude within allowed tools)
   - Claude creates JSON files in `/tmp/outputs/` to specify actions

### Job 3: Execute Outputs

This job validates and executes the actions Claude requested:

1. **Downloads artifacts**: Retrieves the `/tmp/outputs/` directory from the previous job
2. **Validates outputs**: For each output type (add-comment, add-label):
   - Checks JSON structure is valid
   - Verifies constraints (max 1 comment, labels must exist)
   - Validates content (non-empty body, valid label names)
3. **Executes atomically**: Only executes if ALL validations pass
   - Prevents partial failures (e.g., label added but comment fails)
4. **Reports errors**: If validation fails, posts a comment explaining what went wrong

### Job 4: Report Results

Posts a summary comment if any validation errors occurred, helping users understand why actions weren't taken.

## How It Works: Step-by-Step

Let's walk through what happens when someone opens an issue:

### 1. Issue Opened

User creates an issue:
```
Title: Installation fails on Windows

Body: I tried running `npm install -g gh-claude` but got error:
"cannot find module '@anthropic-ai/claude-code'"
```

### 2. Workflow Triggered

GitHub Actions detects the `issues.opened` event and starts the workflow.

### 3. Pre-Flight Validation

The workflow checks:
- Secrets are configured (passes if `ANTHROPIC_API_KEY` exists)
- User authorization (passes since issue opener is a public contributor)
- Rate limit (passes if no issue was opened in the last minute)

### 4. Context Preparation

The workflow builds a context file:
```
GitHub Event: issues
Repository: yourorg/your-repo

Issue #42: Installation fails on Windows
Author: @user123
Body:
I tried running `npm install -g gh-claude` but got error:
"cannot find module '@anthropic-ai/claude-code'"

## Available Repository Labels

The following labels are available in this repository:
bug, enhancement, documentation, question, priority: high, priority: low

**Important**: You can only add labels that already exist.
```

### 5. Claude Analysis

Claude Code CLI receives the context and agent instructions, then:
1. Reads the issue content
2. Recognizes this as a bug report (installation failure)
3. Determines it's not high priority (workaround likely exists)
4. Creates `/tmp/outputs/add-label.json`:
   ```json
   {
     "labels": ["bug"]
   }
   ```
5. Creates `/tmp/outputs/add-comment.json`:
   ```json
   {
     "body": "Thanks for reporting this installation issue! I've labeled this as a bug. This error suggests a dependency resolution problem.\n\nTo help us investigate:\n- What version of npm are you using? (`npm --version`)\n- Can you share the full error output?\n- Have you tried with `npm install -g gh-claude --force`?\n\nA maintainer will look into this soon."
   }
   ```

### 6. Output Validation

The workflow validates:
- `add-label.json`: Valid JSON, labels array exists, "bug" exists in repository
- `add-comment.json`: Valid JSON, body is non-empty (passes)

### 7. Execution

The workflow:
1. Adds the "bug" label to issue #42
2. Posts the comment to issue #42

### 8. User Sees Result

Within seconds, the issue now has:
- A "bug" label
- A welcoming comment asking for more details

## Expected Output Examples

### Example 1: Clear Bug Report

**Input**:
```
Title: API returns 500 error when username is null
Body: Reproducible steps:
1. POST to /api/users with body {"username": null}
2. Observe 500 error instead of 400 validation error
```

**Claude's Actions**:
- Labels: `bug`, `priority: high`
- Comment: "Thanks for the detailed bug report! I've labeled this as a high-priority bug since it's a server error that should be handled gracefully. The issue is clear and includes reproduction steps, which will help the team fix this quickly."

### Example 2: Vague Feature Request

**Input**:
```
Title: Make it better
Body: The tool should be more intuitive
```

**Claude's Actions**:
- Labels: `question`
- Comment: "Thanks for your interest in improving gh-claude! To help us understand your suggestion better, could you elaborate on what aspects feel unintuitive? Specific examples of workflows that could be smoother would be really helpful. I've labeled this as a question for now while we gather more details."

### Example 3: Documentation Issue

**Input**:
```
Title: README example doesn't work
Body: The example in the README for scheduled workflows uses 'cron' but my workflow doesn't run
```

**Claude's Actions**:
- Labels: `documentation`
- Comment: "Thanks for pointing this out! I've labeled this as a documentation issue. The cron syntax can be tricky—could you share what cron expression you tried? Also, note that scheduled workflows only run on the default branch. Check if your agent file is on main/master. A maintainer will review the README to make this clearer."

## Variations and Customization Ideas

### 1. Project-Specific Labels

Customize the categorization labels to match your project:

```markdown
2. **Categorize** the issue by adding ONE of these labels:
   - `type: bug` - Something isn't working
   - `type: feature` - New functionality request
   - `type: refactor` - Code improvement without behavior change
   - `type: performance` - Performance optimization
```

### 2. Component-Based Labeling

Add component labels for better organization:

```markdown
3. **Identify Component** (if applicable):
   - `component: parser` - Issues with markdown parsing
   - `component: generator` - Issues with workflow generation
   - `component: cli` - CLI command problems
   - `component: docs` - Documentation site issues
```

### 3. Size Estimation

Help maintainers estimate effort:

```markdown
4. **Estimate Size** for clear feature requests:
   - `size: small` - < 1 day of work
   - `size: medium` - 1-3 days of work
   - `size: large` - > 3 days of work
```

### 4. Language-Specific Guidance

For polyglot projects, provide language-specific instructions:

```markdown
## Language-Specific Rules

- **TypeScript/JavaScript issues**: Ask for browser/Node version
- **Python issues**: Ask for Python version and virtual env details
- **Docker issues**: Ask for Docker version and OS
```

### 5. Auto-Request Information

Automatically request specific details for certain issue types:

```markdown
## Information Requests

For bugs, always ask for:
- Version of gh-claude (`gh claude --version`)
- Operating system
- Relevant log output

For installation issues, always ask for:
- Package manager (npm, yarn, pnpm) and version
- Node.js version
```

### 6. Duplicate Detection

Use Claude's ability to search for similar issues:

```markdown
5. **Check for Duplicates**:
   - Use Grep to search for similar issue titles
   - If you find a likely duplicate, mention it: "This might be related to #123"
```

### 7. External User Limitations

Restrict which users can trigger the agent:

```yaml
allowed-users:
  - maintainer1
  - maintainer2
```

This prevents external issue spam from consuming API credits.

### 8. Label-Based Triggering

Only triage issues with specific labels:

```yaml
trigger_labels:
  - needs-triage
```

This requires manual label addition before the agent runs.

## Common Issues and Troubleshooting

### Issue: Agent doesn't run on new issues

**Possible causes**:
1. **Secrets not configured**: Check that `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` is set in repository settings → Secrets → Actions
2. **Rate limit hit**: If multiple issues are opened quickly, the agent won't run more than once per minute (adjust `rate_limit_minutes`)
3. **Authorization failure**: External contributors might not be authorized—remove or adjust the authorization check if you want public access

**Debug**:
- Check the Actions tab for failed workflow runs
- Look at the "pre-flight" job logs to see which validation failed

### Issue: Labels don't get added

**Possible causes**:
1. **Label doesn't exist**: Claude can only add existing labels. Create labels in Settings → Labels first
2. **Permission issue**: Workflow needs `issues: write` permission (check the frontmatter)
3. **Validation failure**: Check the "execute-outputs" job logs for validation errors

**Debug**:
- Look at the workflow artifacts to see what Claude created in `/tmp/outputs/`
- Check if a validation error comment was posted on the issue

### Issue: Comment is posted but labels are missing

**Possible causes**:
- Claude created `add-comment.json` but not `add-label.json`
- Label validation failed (invalid label names)

**Fix**: Check the agent instructions are clear about which labels exist. The workflow automatically fetches the current labels from your issue/PR and provides them to Claude for reference.

### Issue: Agent categorizes incorrectly

**Possible causes**:
- Instructions are too vague
- Temperature is too high (causing creative but incorrect responses)

**Fixes**:
- Provide more specific categorization rules with examples
- Lower temperature: `temperature: 0.3` (more deterministic)
- Add project-specific context about what constitutes each category

### Issue: Rate limit is too restrictive/loose

**Adjust**:
```yaml
rate_limit_minutes: 5  # Increase to reduce cost, decrease for faster response
```

Balance between responsiveness and API costs.

### Issue: Comments are too verbose or too brief

**Adjust**:
```markdown
## Guidelines

- Keep comments under 3 sentences
- Only ask for missing information, don't repeat what's already clear
```

Or:

```markdown
## Guidelines

- Provide detailed context about the project to help the contributor
- Include links to relevant documentation
- Give specific examples of what good bug reports include
```

## Cost Estimate

Typical cost per triage:

- **Model**: Claude 3.5 Sonnet
- **Input tokens**: ~1,500 (context + instructions + issue)
- **Output tokens**: ~300 (label decision + comment)
- **Cost per run**: ~$0.008 (less than 1 cent)

For a repository with:
- 50 issues/month
- Monthly cost: ~$0.40

**Cost optimization**:
1. Use `temperature: 0.3` or lower (reduces token usage from more focused responses)
2. Keep instructions concise (fewer input tokens)
3. Set aggressive rate limiting to prevent abuse
4. Use `allowed-users` to restrict who can trigger the agent

**Note**: Costs are based on Claude 3.5 Sonnet pricing as of late 2024. Check current pricing at anthropic.com/pricing.

## Advanced: Integrating with Other Workflows

### Chain with PR Creation

If an issue is a good candidate for contribution, the agent could:

```markdown
5. **Encourage Contribution**:
   - For issues labeled `good first issue`, add encouraging note
   - Include link to CONTRIBUTING.md
   - Suggest creating a branch: "Would you like to work on this?"
```

### Notify Teams via Slack

Combine with a notification workflow:

```yaml
# In another workflow file
on:
  issues:
    types: [labeled]

jobs:
  notify:
    if: contains(github.event.issue.labels.*.name, 'priority: high')
    # Post to Slack webhook
```

### Auto-Assign Based on Component

If you add component labels, use GitHub's auto-assign:

```yaml
# .github/auto-assign.yml
parser:
  - maintainer-who-knows-parser
generator:
  - maintainer-who-knows-generator
```

## Related Examples

- [PR Review](pr-review/) - Automatically review pull requests
- [Daily Summary](daily-summary/) - Generate daily activity reports
