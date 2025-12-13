---
title: Security
description: Security best practices for gh-claude
---

gh-claude is designed with security as a priority. This guide covers the security model and best practices.

## Security Model

### Permission-Based Access

Agents operate under explicit permissions:

```yaml
permissions:
  issues: write        # Can modify issues
  pull_requests: read  # Can only read PRs
```

Without permissions, agents have **read-only** access to public repository data.

### Output Validation

All actions go through validated output handlers:

```yaml
outputs:
  add-comment: { max: 1 }  # Limit to 1 comment
  add-label: true           # Can add labels
```

Claude cannot perform actions not explicitly listed in `outputs`.

### Path Restrictions

File modifications require explicit path allowlisting:

```yaml
allowed-paths:
  - docs/**
  - README.md
```

Prevents agents from modifying critical files like workflow definitions or secrets.

### Sandboxed Execution

Agents run in GitHub Actions with:
- No direct system access
- Controlled API access
- Audit logs in workflow runs

## Best Practices

### 1. Minimal Permissions

Grant only necessary permissions:

```yaml
# ✅ Good - minimal permissions
permissions:
  issues: write

# ❌ Avoid - excessive permissions
permissions:
  contents: write
  issues: write
  pull_requests: write
```

### 2. Constrain Outputs

Use limits to prevent abuse:

```yaml
outputs:
  add-comment: { max: 1 }    # Prevent comment spam
  create-issue: { max: 5 }   # Limit issue creation
```

### 3. Restrict File Access

Limit file modification scope:

```yaml
# ✅ Good - specific paths
allowed-paths:
  - docs/**
  - README.md

# ❌ Avoid - overly broad
allowed-paths:
  - "**"
```

### 4. Validate Before Deploy

Always validate agents:

```bash
gh claude validate --all --strict
```

### 5. Review Generated Workflows

Check compiled workflows before committing:

```bash
gh claude compile --dry-run --all
```

### 6. Use Team Restrictions

Limit who can trigger agents:

```yaml
allowed-actors:
  - trusted-user
allowed-teams:
  - maintainers
```

### 7. Secure API Keys

Store API keys in GitHub Secrets:

```bash
gh secret set ANTHROPIC_API_KEY
```

Never commit API keys to the repository.

## Permission Escalation Prevention

gh-claude prevents privilege escalation through multiple mechanisms:

### GitHub Permissions Model

Agents inherit GitHub Actions permissions, which are:
- **Scoped to repository**: Cannot access other repositories
- **Time-limited**: Only active during workflow run
- **Audited**: All API calls logged in workflow runs
- **Revocable**: Can be changed without modifying agent code

### Required Permission Declaration

Agents must explicitly declare required permissions:

```yaml
# ✅ Explicit permissions
permissions:
  issues: write
  contents: read

# ❌ Missing permissions - defaults to read-only
# (Agent won't be able to add comments)
```

Without declaring permissions, agents have minimal access.

### Output Validation Requirement

Even with permissions, agents need matching outputs:

```yaml
# ✅ Permission + matching output
permissions:
  issues: write
outputs:
  add-comment: true  # Can comment

# ❌ Permission without output
permissions:
  issues: write
# Cannot comment - no output defined
```

This prevents agents from using granted permissions for unintended actions.

### Validation Order

Workflows validate in this order (fail-fast):

1. **Secrets check**: Valid API credentials exist
2. **User authorization**: Actor is allowed to trigger agent
3. **Label check** (if configured): Required labels present
4. **Rate limit check**: Sufficient time since last run
5. **Input collection** (if configured): Minimum data threshold met

Only if all validations pass does the agent execute.

## User Authorization Controls

Control who can trigger agents using multiple methods:

### Default Authorization

By default, these users can trigger agents:
- Repository **administrators**
- Users with **write access**
- **Organization members** (for org repos)

### Explicit Actor Allowlist

Restrict to specific GitHub usernames:

```yaml
allowed-actors:
  - octocat
  - trusted-user
  - security-team-lead
```

When configured, ONLY these users (plus admins) can trigger the agent.

**Use case**: Sensitive operations like releases, deployments

### Team-Based Access

Restrict to GitHub team members:

```yaml
allowed-teams:
  - maintainers
  - security
  - core-contributors
```

Agent only runs for members of specified teams.

**Use case**: Team-specific workflows, role-based access

### Combined Controls

Use both for fine-grained access:

```yaml
allowed-actors:
  - emergency-admin
allowed-teams:
  - on-call-team
```

Actor must match either condition OR be a repository admin.

### Authorization Check Details

The generated workflow validates authorization with this logic:

```bash
# Check user association
USER_ASSOCIATION=$(gh api "repos/$REPO/collaborators/$ACTOR/permission" --jq '.permission')

# Check org membership
IS_ORG_MEMBER=$(gh api "orgs/$ORG/members/$ACTOR" && echo "true" || echo "false")

# Allow if: admin, write access, org member, or in allow list
if [ "$USER_ASSOCIATION" = "admin" ] || [ "$USER_ASSOCIATION" = "write" ]; then
  ALLOWED=true
elif [ "$IS_ORG_MEMBER" = "true" ]; then
  ALLOWED=true
elif [[ " $ALLOWED_ACTORS " =~ " $ACTOR " ]]; then
  ALLOWED=true
else
  ALLOWED=false
  exit 1
fi
```

Failed authorization stops the workflow immediately with a warning.

## Rate Limiting as Security Control

Rate limiting prevents abuse and constrains resource usage:

### Default Rate Limit

All agents have a default 5-minute minimum between runs:

```yaml
# Implicit 5-minute rate limit
name: Issue Triage
on:
  issues:
    types: [opened]
```

Prevents rapid-fire executions from overwhelming the API or repository.

### Custom Rate Limits

Configure per-agent intervals:

```yaml
rate_limit_minutes: 30  # Max once per 30 minutes
```

**Use cases**:
- High-frequency triggers: Set higher limits (60+ minutes)
- Expensive operations: Limit to prevent cost overruns
- Scheduled agents: Ensure once-per-period execution
- Chatty agents: Prevent comment spam

### Rate Limit Bypass Protection

Rate limits are enforced even if:
- Agent is manually triggered
- Multiple events fire simultaneously
- Workflow is re-run

The check uses workflow run history, not event timestamps.

### Implementation Details

```bash
# Get recent successful runs
RECENT_RUNS=$(gh api "repos/$REPO/actions/runs" \
  --jq ".workflow_runs[] | select(.name == \"$WORKFLOW\") | .created_at")

# Check time since last run
CURRENT_TIME=$(date +%s)
RUN_TIMESTAMP=$(date -d "$RECENT_RUN" +%s)
TIME_DIFF=$(( (CURRENT_TIME - RUN_TIMESTAMP) / 60 ))

if [ "$TIME_DIFF" -lt "$RATE_LIMIT_MINUTES" ]; then
  echo "Rate limit: Agent ran $TIME_DIFF minutes ago"
  exit 1
fi
```

### Disabling Rate Limits

Set to `0` to disable (not recommended):

```yaml
rate_limit_minutes: 0  # No rate limiting
```

Only disable for:
- Testing in development repositories
- Low-frequency triggers (e.g., release events)
- Agents with other protective controls

## Safe `allowed-paths` Configuration

File modification requires explicit path allowlisting:

### Path Pattern Syntax

Uses glob patterns:

```yaml
allowed-paths:
  - "docs/**"           # All files under docs/
  - "README.md"         # Specific file
  - "*.md"              # All markdown in root
  - "src/**/*.test.js"  # Test files only
```

### Dangerous Patterns to Avoid

```yaml
# ❌ DANGEROUS - allows modifying workflows
allowed-paths:
  - ".github/**"

# ❌ DANGEROUS - allows modifying anything
allowed-paths:
  - "**"

# ❌ DANGEROUS - allows modifying agent definitions
allowed-paths:
  - ".github/claude-agents/**"

# ❌ DANGEROUS - allows modifying dependencies
allowed-paths:
  - "package.json"
  - "package-lock.json"
```

### Safe Patterns

```yaml
# ✅ SAFE - documentation only
allowed-paths:
  - "docs/**"
  - "*.md"
  - "!.github/**"  # Exclude .github/

# ✅ SAFE - specific subdirectory
allowed-paths:
  - "src/generated/**"

# ✅ SAFE - specific file types
allowed-paths:
  - "**/*.test.js"
  - "**/*.spec.ts"
```

### Protection Boundaries

Even with `allowed-paths`, agents CANNOT:
- Modify files outside allowed patterns
- Delete the repository
- Change repository settings
- Modify GitHub Actions secrets
- Bypass git history (all changes are committed)

### Validation Before Use

The `update-file` output requires `allowed-paths`:

```yaml
outputs:
  update-file: true
allowed-paths:  # Required!
  - "docs/**"
```

Without `allowed-paths`, validation fails during compilation.

## Common Security Patterns

### Read-Only Analysis

Agent analyzes but takes no actions:

```yaml
# No outputs - read-only
permissions:
  issues: read
```

Results appear in workflow logs only. Useful for:
- Security audits
- Compliance checks
- Internal reporting
- Testing agent logic

### Controlled Interaction

Agent can comment but not modify:

```yaml
permissions:
  issues: write
outputs:
  add-comment: { max: 1 }
```

Useful for:
- User notifications
- Status updates
- Feedback provision
- Triage assistance

### Documentation Updates

Agent can update docs but nothing else:

```yaml
permissions:
  contents: write
  pull_requests: write
allowed-paths:
  - docs/**
outputs:
  update-file: { sign: true }
  create-pr: { sign: true, max: 1 }
```

Useful for:
- API documentation generation
- Changelog updates
- README maintenance
- Examples synchronization

### Restricted by Team

Limit to specific team members:

```yaml
allowed-teams:
  - security-team
permissions:
  contents: write
outputs:
  create-issue: { max: 1 }
```

Useful for:
- Security scanning results
- Compliance reporting
- Team-specific automation
- Role-based workflows

### High-Security Pattern

Maximum restrictions for sensitive operations:

```yaml
allowed-actors:
  - security-lead
rate_limit_minutes: 1440  # Once per day max
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
trigger_labels:
  - security-review-required
```

Useful for:
- Security vulnerability handling
- Production deployments
- Financial operations
- Legal compliance tasks

## Audit Logging and Monitoring

gh-claude provides comprehensive audit capabilities through GitHub Actions:

### Workflow Run Logs

Every agent execution is fully logged:

**What's logged**:
- Validation step results (user checks, rate limits, label checks)
- Input collection results (what data was gathered)
- Full Claude CLI execution (prompts, responses, errors)
- Output execution (comments posted, files modified, etc.)
- Timing information for performance analysis

**Accessing logs**:
1. Navigate to repository **Actions** tab
2. Select the workflow run
3. Expand job steps to view detailed logs
4. Download logs for archival (up to 90 days retention)

### Git Commit History

All file modifications are tracked:

```bash
# View commits made by agents
git log --author="github-actions[bot]"

# See what files an agent modified
git log --author="github-actions[bot]" --stat

# View specific agent changes
git show <commit-hash>
```

**Attribution includes**:
- Timestamp of modification
- Which workflow made the change
- Full diff of modifications
- Commit message with context

### API Usage Tracking

Monitor Claude API usage in [Anthropic Console](https://console.anthropic.com):

**Track**:
- Total API calls per day/week/month
- Token usage and costs
- Error rates
- Rate limit hits
- Model usage distribution

**Alerts**:
- Set up usage alerts for budget control
- Monitor for unexpected spikes
- Track quota consumption

### Workflow Event History

GitHub provides event-level auditing:

```bash
# List recent workflow runs
gh run list --workflow "Issue Triage"

# View specific run details
gh run view <run-id>

# Download run logs
gh run download <run-id>
```

### Security Audit Log

For GitHub Enterprise, enable [audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise):

**Captured events**:
- `workflow_run` - When agents execute
- `secret.read` - When secrets are accessed
- `repository.edited` - When repo settings change
- `team.add_member` - When team membership changes (affects `allowed-teams`)

### Monitoring Best Practices

1. **Review logs weekly**: Check for unexpected behavior or errors
2. **Set up notifications**: Use GitHub Actions status badges and email notifications
3. **Archive important runs**: Download logs for compliance requirements
4. **Monitor API costs**: Track Claude API usage to prevent budget overruns
5. **Audit file changes**: Review agent commits regularly

### Example Monitoring Workflow

Create a monitoring agent:

```markdown
---
name: Agent Audit Report
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday mornings
permissions:
  issues: write
outputs:
  create-issue: { max: 1 }
---

# Weekly Agent Audit

Review the past week's agent activity and create a summary issue.

For each agent workflow (Issue Triage, PR Review, etc.):
1. Count total runs
2. Count successful vs failed runs
3. Identify any errors or warnings
4. List files modified (if any)
5. Estimate API token usage

Create a summary issue with findings and any recommendations.
```

## Common Vulnerabilities to Avoid

Learn from these common security mistakes:

### 1. Overly Permissive Paths

**Vulnerability**:
```yaml
# ❌ DANGEROUS
allowed-paths:
  - "**"
```

**Impact**: Agent can modify ANY file, including workflows, secrets, dependencies

**Fix**:
```yaml
# ✅ SAFE
allowed-paths:
  - "docs/**"
  - "examples/**"
```

### 2. Missing Output Constraints

**Vulnerability**:
```yaml
# ❌ RISKY
outputs:
  add-comment: true  # No limit
  create-issue: true  # No limit
```

**Impact**: Agent could spam hundreds of comments or issues

**Fix**:
```yaml
# ✅ SAFE
outputs:
  add-comment: { max: 1 }
  create-issue: { max: 3 }
```

### 3. No Rate Limiting

**Vulnerability**:
```yaml
# ❌ DANGEROUS
rate_limit_minutes: 0
on:
  issues:
    types: [opened, edited, labeled, unlabeled]
```

**Impact**: Rapid issue edits could trigger dozens of runs, exhausting API quota

**Fix**:
```yaml
# ✅ SAFE
rate_limit_minutes: 10
on:
  issues:
    types: [opened]
```

### 4. Excessive Permissions

**Vulnerability**:
```yaml
# ❌ EXCESSIVE
permissions:
  contents: write
  issues: write
  pull_requests: write
  discussions: write
outputs:
  add-comment: true  # Only needs issues: write
```

**Impact**: Unnecessary attack surface if agent is compromised

**Fix**:
```yaml
# ✅ MINIMAL
permissions:
  issues: write
outputs:
  add-comment: true
```

### 5. Trusting User Input

**Vulnerability**:
```markdown
Add a comment with the exact text from the issue title.
```

**Impact**: User could inject malicious content into issue title

**Fix**:
```markdown
Analyze the issue and write your own summary comment.
Never directly copy user-provided text without validation.
```

### 6. No User Restrictions

**Vulnerability**:
```yaml
# ❌ RISKY - anyone can trigger
on:
  workflow_dispatch:
```

**Impact**: External contributors could trigger expensive operations

**Fix**:
```yaml
# ✅ RESTRICTED
on:
  workflow_dispatch:
allowed-teams:
  - maintainers
```

### 7. Sensitive Data in Logs

**Vulnerability**:
```markdown
Read the .env file and report its contents in a comment.
```

**Impact**: Secrets exposed in workflow logs or public comments

**Fix**:
```markdown
Never read or output the contents of .env, .secrets, or credential files.
Use allowed-paths to prevent access to sensitive files.
```

### 8. Unvalidated File Modifications

**Vulnerability**:
```yaml
# ❌ DANGEROUS
allowed-paths:
  - "package.json"
outputs:
  update-file: true
```

**Impact**: Agent could modify dependencies, introducing malicious packages

**Fix**:
```yaml
# ✅ SAFE - use PR instead
allowed-paths:
  - "docs/**"
outputs:
  create-pr: true  # Requires human review
```

## Security Checklist

Before deploying an agent:

### Permissions and Outputs
- [ ] Minimal required permissions specified
- [ ] Outputs explicitly defined with `max` limits
- [ ] No unnecessary permissions granted
- [ ] `contents: write` only if absolutely needed

### File Access
- [ ] `allowed-paths` restricted to specific directories
- [ ] No access to `.github/`, `package.json`, or credential files
- [ ] File modifications create PRs rather than direct commits (when possible)

### User Authorization
- [ ] `allowed-actors` or `allowed-teams` configured for sensitive operations
- [ ] Default authorization (admin/write) is appropriate for the use case
- [ ] Test with non-admin users to verify authorization

### Rate Limiting
- [ ] `rate_limit_minutes` set appropriately for trigger frequency
- [ ] Higher limits (30+ minutes) for high-frequency triggers
- [ ] Rate limiting not disabled without good reason

### Validation and Testing
- [ ] Agent validated with `gh claude validate --strict`
- [ ] Generated workflow reviewed: `gh claude compile --dry-run`
- [ ] Test run completed successfully in development repo
- [ ] Reviewed workflow logs for unexpected behavior

### Credentials and Secrets
- [ ] `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` set in secrets
- [ ] Secrets not committed to repository
- [ ] Organization secrets have appropriate repository access
- [ ] API key rotation plan in place

### Instructions and Logic
- [ ] Agent instructions reviewed for safety
- [ ] No instructions to read/output sensitive files
- [ ] No direct copying of user-provided input
- [ ] Examples provided for expected behavior

### Monitoring and Audit
- [ ] Workflow notifications enabled
- [ ] Plan for reviewing workflow logs regularly
- [ ] API usage monitoring configured
- [ ] Commit history attribution working correctly

## Threat Model

gh-claude implements a defense-in-depth security model with multiple layers of protection.

### What gh-claude Protects Against

#### Unauthorized Actions
- **Output validation**: Agents can only perform actions explicitly listed in `outputs` configuration
- **Action limits**: Configurable `max` constraints prevent spam (e.g., `add-comment: { max: 1 }`)
- **No implicit actions**: Without `outputs` defined, agents are read-only

#### Unauthorized Users
- **User authorization checks**: Only repository admins, write users, org members, or explicitly allowed users can trigger agents
- **Team-based access**: `allowed-teams` restricts agent triggers to specific GitHub teams
- **Actor allowlists**: `allowed-actors` limits triggers to specific GitHub usernames

#### Excessive Resource Usage
- **Rate limiting**: Default 5-minute minimum between runs prevents runaway executions
- **Configurable intervals**: `rate_limit_minutes` allows custom throttling per agent
- **Token limits**: Claude API token limits constrain response length
- **Output constraints**: Limits on comments, issues, PRs prevent API abuse

#### File System Tampering
- **Path restrictions**: `allowed-paths` explicitly defines modifiable file paths
- **Glob pattern validation**: Only files matching patterns can be modified
- **Git history protection**: All changes are committed with full attribution
- **Workflow isolation**: Agents cannot modify `.github/workflows/` by default

#### Privilege Escalation
- **Permission-based access**: Explicit `permissions` required for write operations
- **Minimal default permissions**: Read-only by default, write must be granted
- **Sandboxed execution**: Agents run in isolated GitHub Actions runners
- **No sudo or elevated access**: Standard user permissions only

#### Code Injection
- **No arbitrary code execution**: Agents use Claude Code CLI with controlled tool access
- **Tool allowlist**: Only specific tools enabled (`Bash(git*)`, `Bash(gh*)`, `Read`, `Glob`, `Grep`)
- **No shell injection**: Inputs are properly escaped and validated
- **YAML validation**: Agent definitions validated against schema before compilation

### What You Should Protect Against

While gh-claude provides strong security controls, repository administrators must also:

#### Malicious Agent Instructions
- **Review all agent markdown files**: Instructions are prompts to Claude, review them like code
- **Audit agent changes**: PR reviews should include `.github/claude-agents/` changes
- **Test before deploying**: Use `--dry-run` to preview generated workflows
- **Principle of least privilege**: Don't grant excessive permissions "just in case"

#### Social Engineering Attacks
- **Validate PR changes carefully**: Attackers might submit PRs modifying agent behavior
- **Protect agent files**: Consider requiring reviews for `.github/claude-agents/` changes
- **Review generated workflows**: Check `.github/workflows/` for unexpected changes
- **Monitor workflow runs**: Watch Actions logs for suspicious activity

#### Credential Exposure
- **Never commit API keys**: Use GitHub Secrets exclusively
- **Rotate keys regularly**: Change API keys and OAuth tokens periodically
- **Limit secret scope**: Use repository-level secrets when possible
- **Audit secret access**: Review which workflows access which secrets

#### Workflow Tampering
- **Protect default branch**: Require PR reviews for main/master branch
- **Use branch protection**: Enable "Require review" for `.github/` changes
- **Enable status checks**: Require validation to pass before merging
- **Sign commits**: Use GPG-signed commits for agent changes

#### Supply Chain Attacks
- **Pin action versions**: Generated workflows use specific versions
- **Review dependencies**: Audit npm packages and GitHub Actions used
- **Monitor for updates**: Watch for security advisories
- **Use Dependabot**: Enable automated dependency updates

#### Data Exfiltration
- **Limit API access**: Agents cannot make arbitrary HTTP requests
- **Review outputs**: Check what data agents include in comments/issues
- **Restrict file access**: Use `allowed-paths` to prevent reading sensitive files
- **Monitor API usage**: Watch Anthropic Console for unusual patterns

## Reporting Security Issues

Found a security vulnerability? Please report it responsibly:

1. **Do not** open a public issue
2. Email security contact (see repository)
3. Provide details and reproduction steps

## Audit and Compliance

### Workflow Logs

All agent runs are logged:
- Claude API calls
- Actions performed
- Errors and failures

Access via GitHub Actions logs.

### Git History

All file changes are committed:
- Full attribution
- Reversible via git
- Signed commits available

## Related Resources

- [Authentication Setup](../../guide/authentication/) - Configure API credentials
- [Permissions](../../guide/permissions/) - Control GitHub resource access
- [Outputs](../../guide/outputs/) - Define allowed agent actions
- [Configuration](configuration/) - Repository settings and defaults
- [Agent Definition](../../guide/agent-definition/) - Agent structure and frontmatter
