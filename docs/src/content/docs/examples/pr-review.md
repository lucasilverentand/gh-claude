---
title: PR Review Assistant
description: Provide initial feedback on pull requests
---

This example shows how to create an agent that automatically reviews pull requests and provides initial feedback. The agent analyzes code changes, identifies potential issues, and posts constructive review comments to help maintainers and contributors improve code quality.

## Complete Agent Definition

Create `.github/claude-agents/pr-review.md`:

```markdown
---
name: PR Initial Review
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  pull-requests: write
outputs:
  add-comment: { max: 1 }
  add-label: true
---

# Pull Request Review Agent

You are a helpful code review assistant.

## Your Task

When a pull request is opened or updated:

1. **Analyze Changes**: Review the diff and understand what's being changed

2. **Check for Issues**:
   - Missing tests for new functionality
   - Potentially breaking changes
   - Code style inconsistencies
   - Security concerns
   - Documentation updates needed

3. **Provide Feedback**: Add a comment with:
   - A brief summary of the changes
   - Any concerns or suggestions
   - Praise for good practices
   - Request for tests if needed

4. **Add Labels**:
   - `needs-tests` if tests are missing
   - `breaking-change` if it's a breaking change
   - `needs-docs` if documentation is missing
   - `ready-for-review` if it looks good

## Guidelines

- Be constructive and encouraging
- Focus on significant issues, not nitpicks
- Explain *why* something might be a concern
- Remember: you're here to help, not to block progress
- Acknowledge what's done well

## Available Actions

You have access to GitHub MCP tools for safe interactions:
- Use the GitHub MCP tools to add comments to pull requests
- Use the GitHub MCP tools to add labels to pull requests
- The tools are namespaced as `mcp__github__*` and provide structured, safe access to GitHub operations

Example workflow:
1. Analyze the PR changes using Read/Grep/Glob tools
2. Review for potential issues
3. Draft constructive feedback
4. Use GitHub MCP to post your review comment (max 1 per run)
5. Use GitHub MCP to add appropriate labels
```

## Generated Workflow Explained

When you run `gh claude compile pr-review.md`, it generates `.github/workflows/claude-pr-initial-review.yml`. The structure is similar to the issue triage workflow but with PR-specific context:

### Job 1: Pre-Flight Validation

Checks:
1. **Secrets**: Validates Anthropic API credentials exist
2. **User Authorization**: Ensures the PR author is authorized
   - Allows repository collaborators and organization members
   - Blocks unauthorized external contributors (prevents spam PRs from triggering costly reviews)
3. **Rate Limiting**: Default 5-minute cooldown between runs
   - Prevents rapid re-runs when pushing multiple commits quickly
   - Protects API budget from force-push loops

### Job 2: Claude Agent Execution

Key differences from issue triage:

1. **PR Context**: Instead of issue body, provides:
   - PR title, number, and author
   - PR description/body
   - File diff information (Claude can use Read/Grep/Glob to examine changes)
2. **Tools Available**:
   - `Read`: Examine changed files
   - `Glob`: Find files matching patterns (e.g., test files)
   - `Grep`: Search for patterns (e.g., TODO comments, missing error handling)
   - `Write(/tmp/outputs/*)`: Create action outputs
3. **GitHub MCP Integration**: The agent can use GitHub MCP tools to:
   - Post review comments
   - Add labels
   - Request changes or approve (if configured)

### Job 3: Execute Outputs

Validates and executes the review actions:
- Ensures comments are well-formed
- Verifies labels exist in the repository
- Posts the review comment to the PR
- Adds labels atomically

## How It Works: Step-by-Step

Let's walk through a complete PR review cycle:

### 1. Pull Request Opened

A contributor opens a PR:
```
Title: Add user authentication endpoint

Body:
This PR adds JWT-based authentication for the /api/auth endpoint.

Changes:
- New AuthController with login/logout methods
- JWT token generation and validation
- Middleware for protecting routes

Fixes #123
```

Files changed:
- `src/controllers/AuthController.ts` (new file, 150 lines)
- `src/middleware/auth.ts` (new file, 45 lines)
- `src/routes/api.ts` (modified, +10 lines)
- `package.json` (modified, +2 dependencies: `jsonwebtoken`, `bcrypt`)

### 2. Workflow Triggered

GitHub Actions detects `pull_request.opened` and starts the workflow.

### 3. Pre-Flight Validation

Checks pass:
- API key configured
- PR author is a repository collaborator
- No PR review ran in the last 5 minutes

### 4. Context Preparation

Workflow builds context:
```
GitHub Event: pull_request
Repository: yourorg/your-repo

PR #87: Add user authentication endpoint
Author: @contributor
Body:
This PR adds JWT-based authentication for the /api/auth endpoint.
...
```

### 5. Claude Analysis

Claude examines the PR:

```
# What Claude does internally:
1. Read PR description to understand intent
2. Use Glob to find changed files
3. Use Read to examine new/modified files
4. Use Grep to check for test files matching *AuthController*
5. Analyze code for:
   - Missing tests (found: no test files)
   - Security issues (found: JWT secret handling needs review)
   - Best practices (found: good error handling)
```

Claude creates outputs:

**`/tmp/outputs/add-label.json`**:
```json
{
  "labels": ["needs-tests", "security-review"]
}
```

**`/tmp/outputs/add-comment.json`**:
```json
{
  "body": "## PR Review Summary\n\nThanks for this contribution! This PR adds JWT-based authentication, which is a critical security feature.\n\n### Observations\n\n- **Clean implementation**: The AuthController follows existing patterns well\n- **Good error handling**: Proper try/catch blocks and error responses\n- **Dependencies added**: `jsonwebtoken` and `bcrypt` are appropriate choices\n\n### Security Concerns\n\n⚠️ **JWT Secret Management**: The JWT secret appears to be read from an environment variable, which is good. Please ensure:\n- The secret is stored securely in your deployment environment\n- It's added to `.env.example` with a placeholder value\n- Documentation explains how to set it up\n\n### Testing\n\n❌ **Missing tests**: No test files found for the new AuthController. Please add tests covering:\n- Successful login with valid credentials\n- Login failure with invalid credentials\n- Token validation (valid, expired, malformed)\n- Protected route access with/without token\n\n### Suggestions\n\n- Consider adding rate limiting to the login endpoint to prevent brute force attacks\n- The token expiration is hardcoded to 24h—consider making this configurable\n- Add JSDoc comments to the public methods in AuthController\n\n### Labels Added\n\n- `needs-tests`: Please add test coverage\n- `security-review`: Maintainer should review security aspects before merging\n\nOverall, this is a solid start! Once tests are added and the security considerations are addressed, this should be ready to merge."
}
```

### 6. Output Validation and Execution

Workflow validates outputs (both pass) and executes:
1. Adds labels: `needs-tests`, `security-review`
2. Posts the review comment to PR #87

### 7. Contributor Sees Review

Within 30-60 seconds of opening the PR, the contributor receives:
- Automated review comment with specific feedback
- Labels indicating what needs attention

### 8. PR Updated

Contributor pushes new commits with tests. Workflow triggers again on `pull_request.synchronize`:

1. Claude re-analyzes the PR
2. Finds test files now exist
3. Removes `needs-tests` concern
4. Posts updated review focusing on remaining items

## Expected Output Examples

### Example 1: Well-Structured PR

**Input**: PR adds a new feature with tests and documentation

**Claude's Review**:
```
## PR Review Summary

Excellent work on this feature! This PR is well-structured and ready for review.

### Observations

- **Comprehensive testing**: Unit tests cover all new functionality
- **Documentation updated**: README includes usage examples
- **Clean code**: Follows project style guidelines
- **No breaking changes**: Backward compatible API

### Suggestions

- Consider adding a migration guide section if users need to update their code
- The new feature could benefit from an example in the `/examples` directory

### Labels Added

- `ready-for-review`: This PR looks good for maintainer review

Great job! A maintainer will review this soon.
```

### Example 2: PR with Issues

**Input**: PR with hardcoded values, missing error handling, no tests

**Claude's Review**:
```
## PR Review Summary

Thanks for this contribution! There are a few areas that need attention before this can be merged.

### Concerns

❌ **Hardcoded configuration**: Line 45 has a hardcoded API URL. This should use an environment variable:
\`\`\`typescript
// Instead of:
const API_URL = "https://api.example.com";

// Use:
const API_URL = process.env.API_URL || "https://api.example.com";
\`\`\`

❌ **Missing error handling**: The fetch call on line 67 doesn't handle network errors. Wrap it in try/catch.

❌ **No tests**: Please add tests for the new functionality.

### Suggestions

- Consider extracting the configuration values to `src/config.ts`
- Add JSDoc comments explaining the parameters

### Labels Added

- `needs-work`: Please address the concerns above
- `needs-tests`: Add test coverage

Let me know if you have any questions!
```

### Example 3: Breaking Change PR

**Input**: PR that changes a public API signature

**Claude's Review**:
```
## PR Review Summary

⚠️ **Breaking Change Detected**

This PR modifies the signature of `createUser()`, which is a public API. This will break existing code.

### Breaking Changes

- `createUser(name, email)` → `createUser(options: UserOptions)`
- Return type changed from `User` to `Promise<User>`

### Recommendations

1. **Version bump**: This requires a major version bump (e.g., 1.x.x → 2.0.0)
2. **Migration guide**: Add a migration guide in CHANGELOG.md
3. **Deprecation path**: Consider keeping the old signature with a deprecation warning for one version

### Alternative Approach

You could maintain backward compatibility:
\`\`\`typescript
function createUser(
  nameOrOptions: string | UserOptions,
  email?: string
): Promise<User> {
  const options = typeof nameOrOptions === 'string'
    ? { name: nameOrOptions, email: email! }
    : nameOrOptions;
  // ...
}
\`\`\`

### Labels Added

- `breaking-change`: Requires major version bump
- `needs-discussion`: Team should discuss the best approach

Please discuss with the maintainers before proceeding.
```

## Variations and Customization Ideas

### 1. Language-Specific Reviews

Customize for your tech stack:

```markdown
## TypeScript-Specific Checks

When reviewing TypeScript code:
- Flag usage of `any` type (suggest specific types instead)
- Check for proper null/undefined handling
- Verify interfaces are exported for public APIs
- Ensure async functions have proper error handling

## Python-Specific Checks

When reviewing Python code:
- Verify type hints are present
- Check for proper exception handling
- Ensure docstrings follow Google or NumPy style
- Verify `requirements.txt` is updated for new dependencies
```

### 2. Project-Specific Patterns

Enforce your team's conventions:

```markdown
## Project Conventions

Check that the PR follows our standards:
- All new functions have JSDoc comments
- Public APIs are exported from `src/index.ts`
- Error messages use our error code system (see `src/errors/`)
- Database queries use the QueryBuilder, not raw SQL
```

### 3. Security-Focused Review

For security-critical codebases:

```markdown
## Security Checklist

Review for common vulnerabilities:
- SQL injection (check for string concatenation in queries)
- XSS vulnerabilities (check HTML rendering of user input)
- Authentication bypasses (verify protected routes)
- Sensitive data in logs (check for password/token logging)
- CORS configuration (verify allowed origins)
```

### 4. Performance Review

Focus on performance implications:

```markdown
## Performance Considerations

Check for performance issues:
- N+1 database queries
- Missing pagination on list endpoints
- Large file uploads without streaming
- Synchronous operations blocking the event loop
- Missing database indexes for new queries
```

### 5. Documentation Requirements

Ensure documentation is updated:

```markdown
## Documentation Requirements

For this PR to be complete:
- [ ] API changes documented in `docs/api.md`
- [ ] CHANGELOG.md updated with new features/fixes
- [ ] Migration guide if breaking changes
- [ ] Example added to `examples/` directory
- [ ] README updated if user-facing changes
```

### 6. Automated Suggestions

Have Claude propose specific code improvements:

```markdown
## Code Suggestions

If you notice patterns that could be improved:
- Suggest refactoring opportunities
- Recommend more efficient algorithms
- Propose better naming for unclear variables
- Suggest extracting duplicated code into helpers
```

### 7. Review Scope Control

Limit reviews to specific file types:

```markdown
## Review Scope

Only review substantive code changes:
- Focus on `.ts`, `.js`, `.py` files
- Skip `.md`, `.json`, `.lock` files unless they contain errors
- Ignore formatting-only changes
- Skip generated files (build output, compiled code)
```

### 8. Approval Workflow

For trusted contributors, approve automatically:

```markdown
## Auto-Approval Criteria

If all conditions are met, add `approved` label:
- PR from core team member
- All tests pass
- No breaking changes detected
- Documentation updated
- Code coverage maintained or increased
```

## Common Issues and Troubleshooting

### Issue: Agent doesn't run on PR updates

**Possible causes**:
1. **Trigger configuration**: Ensure `types: [opened, synchronize]` is set
   - `opened`: Runs when PR is first created
   - `synchronize`: Runs when new commits are pushed
2. **Rate limit**: 5-minute cooldown may block rapid commits
3. **Authorization**: External contributors may not be authorized

**Fix**:
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
rate_limit_minutes: 2  # Reduce for faster iteration
```

### Issue: Review is too generic

**Possible causes**:
- Instructions are too vague
- Not examining actual code changes

**Fix**: Add specific review instructions:
```markdown
## Review Process

1. Use Glob to find all changed files
2. Use Read to examine each changed file
3. Look for specific patterns (see checklist)
4. Reference specific line numbers in feedback
```

### Issue: Review misses important issues

**Possible causes**:
- Claude isn't using search tools effectively
- Important patterns not specified in instructions

**Fix**: Add explicit search instructions:
```markdown
## Required Checks

Use Grep to search for:
- `TODO` or `FIXME` comments: grep -r "TODO|FIXME" src/
- Console logs: grep -r "console.log" src/
- Debugging code: grep -r "debugger" src/
- Hardcoded secrets: grep -r "password|secret|key.*=" src/
```

### Issue: Reviews are too long

**Possible causes**:
- No length constraint in instructions
- Temperature too high (verbose responses)

**Fix**:
```yaml
claude:
  temperature: 0.2  # More focused, less verbose
```

```markdown
## Guidelines

- Keep reviews under 500 words
- Focus on 3-5 most important issues
- Omit praise if no significant positive observations
```

### Issue: Agent adds labels that don't exist

**Possible causes**:
- Labels not created in repository

**Debug**: Check workflow logs for validation errors. The execute-outputs job will report which labels don't exist.

**Fix**: Create labels in repository settings first:
```bash
gh label create "needs-tests" --color "fbca04"
gh label create "breaking-change" --color "d73a4a"
gh label create "ready-for-review" --color "0e8a16"
```

### Issue: Too expensive for high-traffic repos

**Possible causes**:
- Large PRs with many files
- Agent reviews every synchronize event

**Optimizations**:
```yaml
rate_limit_minutes: 30  # Only review once per 30 min

# Or use trigger_labels to require manual opt-in:
trigger_labels:
  - needs-ai-review
```

Also consider:
- Limiting to specific file patterns (in instructions)
- Using Claude Haiku for smaller PRs
- Skipping trivial changes (docs-only, version bumps)

## Cost Estimate

Typical cost per PR review:

- **Model**: Claude 3.5 Sonnet
- **Input tokens**: ~3,000-8,000 (context + instructions + code)
  - Varies based on PR size and number of files
- **Output tokens**: ~500-1,000 (review comment)
- **Cost per review**: ~$0.02-$0.05 (2-5 cents)

For a repository with:
- 100 PRs/month
- Average 2 updates per PR (open + one revision)
- Total runs: 200/month
- Monthly cost: ~$4-$10

**Cost optimization strategies**:

1. **Skip small PRs**: Don't review PRs with < 10 lines changed
2. **Use Haiku for simple reviews**: 10x cheaper for straightforward PRs
3. **Rate limiting**: Aggressive rate limits prevent expensive re-runs
4. **Restrict to team members**: Use `allowed-users` to limit who triggers reviews
5. **Batch reviews**: Only review when a specific label is added manually

**Example cost-optimized configuration**:
```yaml
rate_limit_minutes: 60  # Max 1 review per hour
trigger_labels:
  - ready-for-ai-review  # Require manual trigger
```

## Advanced: Multi-Stage Review

Implement a two-stage review process:

### Stage 1: Quick Triage (Claude Haiku)

```yaml
name: PR Quick Triage
claude:
  model: claude-3-5-haiku-20241022  # Faster, cheaper
```

```markdown
Quick initial assessment:
- Does PR have tests?
- Is description clear?
- Any obvious red flags?

Add labels: needs-tests, needs-description, or ready-for-review
```

### Stage 2: Deep Review (Claude Sonnet)

```yaml
name: PR Deep Review
on:
  pull_request:
    types: [labeled]
trigger_labels:
  - ready-for-review
claude:
  model: claude-3-5-sonnet-20241022  # More thorough
```

```markdown
Comprehensive code review:
- Detailed security analysis
- Architecture and design review
- Performance implications
- Code quality assessment
```

This approach saves costs by only using the expensive model when needed.

## Related Examples

- [Issue Triage](issue-triage/) - Automatically triage incoming issues
- [Daily Summary](daily-summary/) - Generate daily activity reports
