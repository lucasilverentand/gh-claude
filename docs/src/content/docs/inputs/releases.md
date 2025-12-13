---
title: Releases Input Type
description: Collect and filter repository releases
---

Collect releases and pre-releases from your repository with filtering options.

## Configuration

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 10
```

## Configuration Options

- **`prerelease`** (boolean): Include pre-releases
  - `true` - Include pre-release versions (alpha, beta, rc)
  - `false` - Only stable releases
  - Default: `false`

- **`draft`** (boolean): Include draft releases
  - `true` - Include draft releases not yet published
  - `false` - Only published releases
  - Default: `false`

- **`limit`** (number): Maximum releases to fetch
  - Default: `20`
  - Maximum: `100`

## Output Format

When Claude receives releases data, it's formatted like this:

```markdown
## 🚀 Releases

### v2.1.0 - Major Feature Release
**Author:** @maintainer | **Published:** 2024-01-15T08:00:00Z
**Type:** Release
**URL:** https://github.com/owner/repo/releases/tag/v2.1.0

## What's New
- Added user authentication
- Improved performance
- Bug fixes

## Breaking Changes
- Removed deprecated API endpoints
---
```

Each release includes:
- Release version/tag name and title
- Release author
- Publication timestamp
- Release type (Release or Pre-release)
- Direct link to the release
- Release notes/body

## Configuration Examples

### Stable Releases Only

Collect only published stable releases:

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 20
```

### Include Pre-releases

Collect all releases including betas and RCs:

```yaml
inputs:
  releases:
    prerelease: true
    draft: false
    limit: 30
```

### Include Drafts

Collect draft releases (unreleased):

```yaml
inputs:
  releases:
    prerelease: false
    draft: true
    limit: 10
```

### All Releases

Collect everything:

```yaml
inputs:
  releases:
    prerelease: true
    draft: true
    limit: 50
```

### Recent Releases

Collect the most recent releases:

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 5
```

## Use Cases

### 1. Release Announcements

Monitor releases and automatically post announcements:

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 5
  since: last-run
  min_items: 1
```

Claude could create discussion posts announcing new releases.

### 2. Release Notes Generation

Collect releases and draft comprehensive release notes:

```yaml
inputs:
  releases:
    prerelease: true
    draft: false
    limit: 10
  since: 7d
  min_items: 1
```

Claude could format release notes for publishing.

### 3. Version Tracking

Monitor version changes and breaking changes:

```yaml
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 20
```

Claude could analyze version patterns and breaking changes.

### 4. Pre-release Monitoring

Track alpha, beta, and RC releases:

```yaml
inputs:
  releases:
    prerelease: true
    draft: false
    limit: 10
  since: 7d
  min_items: 1
```

Claude could notify testers about new pre-releases.

### 5. Draft Management

Monitor draft releases awaiting publication:

```yaml
inputs:
  releases:
    prerelease: false
    draft: true
    limit: 10
```

Claude could remind about drafts needing publication.

## Real-World Example

A release monitor that announces new releases:

```yaml
---
name: Release Announcer
on:
  workflow_dispatch: {}
  schedule:
    - cron: '0 10 * * *'  # 10 AM daily
permissions:
  discussions: write
  contents: read
outputs:
  create-discussion: true
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 10
  since: last-run
  min_items: 1
---

When a new release is published, create a discussion post with:

1. **Release Title**: The version and headline
2. **What's New**: Key features and improvements
3. **Breaking Changes**: Compatibility notes
4. **Contributors**: Thank contributors
5. **Download**: Link to releases page

Make it celebratory and informative for the community!
```

## Performance Tips

### Filter by Status

Use release status filters to reduce results:

```yaml
# Better - only stable releases
inputs:
  releases:
    prerelease: false
    draft: false
    limit: 20
```

### Limit Results

Releases are usually small, but limit accordingly:

```yaml
# For monitoring (get all recent)
inputs:
  releases:
    limit: 20

# For summaries (just top releases)
inputs:
  releases:
    limit: 5
```

## Release Types Reference

### Stable Release

A published production release:
- No pre-release flag
- No draft flag
- Example: `v2.0.0`

### Pre-release

An early version for testing:
- Has pre-release flag
- Examples: `v2.0.0-alpha`, `v2.0.0-beta.1`, `v2.0.0-rc.1`
- Often used for feedback before stable release

### Draft

Unpublished release preparation:
- Has draft flag
- Not yet visible to users
- Used for release note preparation

## Common Configurations

### Stable Only

```yaml
releases:
  prerelease: false
  draft: false
  limit: 20
```

### All Releases

```yaml
releases:
  prerelease: true
  draft: true
  limit: 50
```

### Recent Stable

```yaml
releases:
  prerelease: false
  draft: false
  limit: 5
```

### Pre-releases Only

```yaml
releases:
  prerelease: true
  draft: false
  limit: 20
```

## Release Notes Best Practices

Well-formatted release notes work better with Claude:

**Good format:**

```
## What's New

- Added user authentication
- Improved performance by 30%
- Fixed memory leak in database

## Breaking Changes

- Removed deprecated API v1
- Changed config format (see migration guide)

## Contributors

Thanks to @alice, @bob, and @charlie!
```

**Poor format:**

```
lots of stuff fixed and added, check the commits for details
```

Clear release notes help Claude understand what to highlight.

## Semantic Versioning

If your releases follow semantic versioning (major.minor.patch):

```
v1.0.0 - Initial release
v1.0.1 - Patch fix
v1.1.0 - New features
v2.0.0 - Breaking changes
```

Claude can use this information to understand the significance of releases.

## See Also

- [Overview](./): Main inputs documentation
- [Time Filtering](./time-filtering/): Configure time ranges with `since`
- [Commits](./commits/): See commits included in releases
- [Pull Requests](./pull-requests/): See PRs merged in release
