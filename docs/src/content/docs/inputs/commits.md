---
title: Commits Input Type
description: Collect and filter commits from repository branches
---

Collect commits from specified branches with filtering options.

## Configuration

```yaml
inputs:
  commits:
    branches: [main, develop]
    authors: [username]
    exclude_authors: [bot]
    limit: 100
```

## Configuration Options

- **`branches`** (array): Branches to check
  - Default: `["main", "master"]` if not specified
  - Fetches commits from all specified branches
  - Each branch is queried separately

- **`authors`** (array): Only commits by these authors
  - Specify GitHub usernames or email addresses
  - Filters by commit author

- **`exclude_authors`** (array): Exclude commits by these authors
  - Useful for filtering out bot commits
  - Common to exclude: `dependabot`, `renovate`, `github-actions`
  - Specify usernames or email addresses

- **`limit`** (number): Maximum commits per branch
  - Default: `100`
  - Maximum: `1000`
  - Applied to each branch independently

## Output Format

When Claude receives commits data, it's formatted like this:

```markdown
## 📝 Commits

- [`a1b2c3d`](https://github.com/owner/repo/commit/a1b2c3d) Add user authentication - @developer (2024-01-15T10:00:00Z)
- [`e4f5g6h`](https://github.com/owner/repo/commit/e4f5g6h) Fix validation bug - @developer (2024-01-15T09:30:00Z)
- [`i7j8k9l`](https://github.com/owner/repo/commit/i7j8k9l) Update dependencies - @maintainer (2024-01-14T16:00:00Z)
```

Each commit includes:
- Commit hash (linked to the commit page)
- Commit message
- Author username
- Timestamp

## Configuration Examples

### Main Branch Only

Collect commits from main branch:

```yaml
inputs:
  commits:
    branches: [main]
    limit: 100
```

### Exclude Bot Commits

Get human commits only:

```yaml
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]
    limit: 100
```

### Team Commits

Collect commits from specific team members:

```yaml
inputs:
  commits:
    branches: [main]
    authors: [alice, bob, charlie]
    limit: 100
```

### Multiple Branches

Track work across development branches:

```yaml
inputs:
  commits:
    branches: [main, develop, staging]
    exclude_authors: [dependabot]
    limit: 50
```

### Feature Branch Activity

Monitor commits on feature branches:

```yaml
inputs:
  commits:
    branches: [feature/auth, feature/dashboard, feature/api]
    limit: 100
```

### Exclude Bot and Merge Commits

Get real development work:

```yaml
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]
    limit: 200
```

## Use Cases

### 1. Activity Monitoring

Monitor recent commits and development activity:

```yaml
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate]
    limit: 100
  since: last-run
  min_items: 1
```

Claude could generate daily activity reports showing what was merged.

### 2. Release Notes

Collect commits between releases:

```yaml
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot]
    limit: 500
  since: 7d
  min_items: 5
```

Claude could draft release notes from commit messages.

### 3. Team Productivity

Track team member contributions:

```yaml
inputs:
  commits:
    branches: [main, develop]
    limit: 200
  since: 7d
  min_items: 1
```

Claude could analyze who is contributing most actively.

### 4. Dependency Updates

Monitor dependency updates separately:

```yaml
inputs:
  commits:
    branches: [main]
    authors: [dependabot, renovate]
    limit: 100
  since: 7d
  min_items: 1
```

Claude could summarize dependency changes.

### 5. Code Review Metrics

Analyze merged commits and author activity:

```yaml
inputs:
  commits:
    branches: [main]
    exclude_authors: [github-actions]
    limit: 200
  since: 7d
  min_items: 1
```

Claude could identify review bottlenecks based on merge patterns.

## Real-World Example

A weekly activity digest showing team contributions:

```yaml
---
name: Weekly Activity Summary
on:
  schedule:
    - cron: '0 10 * * 1'  # Monday 10 AM
  workflow_dispatch: {}
permissions:
  contents: read
outputs:
  create-discussion: true
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]
    limit: 200
  since: 7d
  min_items: 5
---

Analyze the commits and create a discussion post with:

1. **Contributors**: Active contributors this week
2. **Features**: Major features merged
3. **Fixes**: Important bugs fixed
4. **Activity**: Commits by day
5. **Trends**: Notable patterns or focus areas

Make it informative and celebrate team achievements!
```

## Performance Tips

### Exclude Noisy Authors

Filter out bot commits to reduce noise:

```yaml
# Better - exclude automation
inputs:
  commits:
    branches: [main]
    exclude_authors: [dependabot, renovate, github-actions]
    limit: 100
```

### Focus on Relevant Branches

Choose specific branches rather than collecting from many:

```yaml
# Better - specific branches
inputs:
  commits:
    branches: [main, develop]
    limit: 100

# Avoid - too many branches
inputs:
  commits:
    branches: [main, develop, staging, feature1, feature2, feature3]
    limit: 100
```

### Adjust Limits Per Use Case

Different use cases need different amounts of data:

```yaml
# For recent activity (daily)
inputs:
  commits:
    branches: [main]
    limit: 50

# For weekly summaries
inputs:
  commits:
    branches: [main]
    limit: 200

# For release notes (monthly)
inputs:
  commits:
    branches: [main]
    limit: 500
```

## Common Configurations

### Recent Activity

```yaml
commits:
  branches: [main]
  exclude_authors: [dependabot, renovate]
  limit: 100
```

### Team Work

```yaml
commits:
  branches: [main, develop]
  exclude_authors: [github-actions]
  limit: 200
```

### Release Notes

```yaml
commits:
  branches: [main]
  exclude_authors: [dependabot, renovate, github-actions]
  limit: 500
```

### Activity Report

```yaml
commits:
  branches: [main]
  limit: 150
```

## Commit Message Best Practices

The quality of commit messages determines how useful this input is for Claude:

**Good commit messages:**
- `fix: resolve authentication bug in login flow`
- `feat: add dark mode support`
- `refactor: optimize database queries`

**Poor commit messages:**
- `fix stuff`
- `update`
- `wip`

Claude uses commit messages to understand what changed, so descriptive messages are more valuable.

## Branch Strategy Recommendations

### Multi-Branch Monitoring

If your repository uses multiple branches:

```yaml
# Monitor development activity
inputs:
  commits:
    branches: [main, develop]
    exclude_authors: [dependabot]
    limit: 100
  since: last-run
  min_items: 1
```

### Main Branch Only

For simpler workflows:

```yaml
# Safer - only merged code
inputs:
  commits:
    branches: [main]
    limit: 100
```

### Release Branch Tracking

For release management:

```yaml
# Monitor release branches
inputs:
  commits:
    branches: [main, release/*]
    exclude_authors: [dependabot]
    limit: 200
```

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Releases](./releases/): Get release information
- [Pull Requests](./pull-requests/): See PR data that resulted in these commits
