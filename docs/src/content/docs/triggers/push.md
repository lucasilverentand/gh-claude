---
title: Push Events
description: Respond to code pushes (branches and tags)
---

Trigger your agent when code is pushed to your repository, including branch updates and tag creation.

## Basic Configuration

```yaml
on:
  push:
    branches: [main]
```

## Filter Options

### Branch Filters

Control which branches trigger the agent:

```yaml
on:
  push:
    branches:
      - main
      - 'release/**'
      - 'feature/*'
```

Exclude specific branches:

```yaml
on:
  push:
    branches-ignore:
      - 'dependabot/**'
      - 'renovate/**'
```

You can use glob patterns:
- `*` matches any character except `/`
- `**` matches any character including `/`
- `?` matches a single character
- `[abc]` matches any character in the brackets

### Tag Filters

Trigger on tag pushes:

```yaml
on:
  push:
    tags:
      - 'v*'
      - 'release-*'
```

Exclude specific tags:

```yaml
on:
  push:
    tags-ignore:
      - '*-beta'
      - '*-alpha'
```

### Path Filters

Only trigger when specific files change:

```yaml
on:
  push:
    paths:
      - 'src/**'
      - '*.ts'
      - 'package.json'
```

Ignore changes to specific paths:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - '.github/**'
```

## Common Use Cases

### Code Review on Push

Analyze pushed code for issues:

```yaml
---
name: Push Code Review
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - '*.ts'
permissions:
  contents: read
  pull_requests: write
---

Review the pushed code changes for:
1. Potential bugs or issues
2. Code style violations
3. Security concerns
4. Performance problems

If issues are found, create an issue summarizing the problems.
```

### Auto-Fix Linting

Automatically fix linting issues after push:

```yaml
---
name: Auto Lint Fix
on:
  push:
    branches-ignore:
      - main
    paths:
      - '**/*.ts'
      - '**/*.js'
permissions:
  contents: write
outputs:
  create-pr: true
allowed-paths:
  - 'src/**'
---

Check if there are any linting issues in the pushed code.
If found, create a PR with the fixes applied.
```

### Update Documentation

Update documentation when code changes:

```yaml
---
name: Docs Updater
on:
  push:
    branches: [main]
    paths:
      - 'src/**/*.ts'
      - 'src/**/*.tsx'
permissions:
  contents: write
outputs:
  create-pr: true
allowed-paths:
  - 'docs/**'
---

Analyze the changed source files and update related documentation:
1. Check for new or changed exports
2. Update API documentation
3. Update usage examples if needed
```

### Release Notes Generation

Generate release notes when tags are pushed:

```yaml
---
name: Release Notes
on:
  push:
    tags:
      - 'v*'
permissions:
  contents: write
outputs:
  update-file: true
allowed-paths:
  - 'CHANGELOG.md'
---

Generate release notes for the new version tag:
1. List all commits since the last tag
2. Categorize changes (features, fixes, breaking changes)
3. Update CHANGELOG.md with the new release
```

## Combining Filters

You can combine multiple filter types:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
    paths-ignore:
      - 'src/**/*.test.ts'
```

This triggers on pushes to main that change files in `src/` but not test files.

## Available Data

When your agent runs on a push event, it has access to:

- **Commit SHA** - via `${{ github.sha }}`
- **Branch name** - via `${{ github.ref_name }}`
- **Full ref** - via `${{ github.ref }}`
- **Before SHA** - via `${{ github.event.before }}`
- **After SHA** - via `${{ github.event.after }}`
- **Commits** - via `${{ github.event.commits }}`
- **Pusher** - via `${{ github.event.pusher.name }}`

Access commit details using the `gh` CLI:

```bash
# Get commit details
gh api repos/{owner}/{repo}/commits/${{ github.sha }}

# Compare changes
gh api repos/{owner}/{repo}/compare/${{ github.event.before }}...${{ github.event.after }}
```

## Required Permissions

For read-only operations:

```yaml
permissions:
  contents: read
```

For operations that modify files or create PRs:

```yaml
permissions:
  contents: write
  pull_requests: write
```

## Best Practices

### Be Specific with Paths

Avoid running on every push by filtering paths:

```yaml
# Good - specific paths
on:
  push:
    branches: [main]
    paths:
      - 'src/**'

# Avoid - triggers on any file change
on:
  push:
    branches: [main]
```

### Use branches-ignore for Bot Branches

Prevent infinite loops with bot branches:

```yaml
on:
  push:
    branches-ignore:
      - 'dependabot/**'
      - 'renovate/**'
      - 'claude/**'
```

### Combine with Rate Limiting

Prevent excessive runs during rapid pushes:

```yaml
on:
  push:
    branches: [main]
rate_limit_minutes: 5
```

### Avoid Triggering on Own Commits

If your agent creates commits, be careful to avoid infinite loops by:
1. Using `branches-ignore` for branches the agent commits to
2. Using `paths-ignore` for files the agent modifies
3. Using appropriate rate limiting

## Examples

### Dependency Security Check

```yaml
---
name: Dependency Security
on:
  push:
    branches: [main]
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'pnpm-lock.yaml'
permissions:
  issues: write
outputs:
  create-issue: true
---

When dependencies change, check for security vulnerabilities:
1. Analyze new or updated dependencies
2. Check for known vulnerabilities
3. If vulnerabilities found, create an issue with details and remediation steps
```

### API Breaking Change Detection

```yaml
---
name: API Change Detector
on:
  push:
    branches: [main]
    paths:
      - 'src/api/**'
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---

Detect breaking changes in API endpoints:
1. Compare current API with previous version
2. Identify removed or changed endpoints
3. Flag potential breaking changes for review
```

## Next Steps

- Learn about [Pull Request triggers](pull-requests/)
- Understand [Permissions](../../guide/permissions/)
- See [Schedule triggers](schedule/) for time-based execution
