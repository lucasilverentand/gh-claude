---
title: Release Events
description: Respond to release activity in your repository
---

Trigger your agent when releases are published, created, edited, or otherwise modified.

## Basic Configuration

```yaml
on:
  release:
    types: [published]
```

## Available Event Types

- **`published`** - Release is published (most common)
- **`unpublished`** - Release is unpublished
- **`created`** - Release is created (includes drafts)
- **`edited`** - Release title, body, or other details are modified
- **`deleted`** - Release is deleted
- **`prereleased`** - Prerelease is published
- **`released`** - Release or prerelease is published (includes prereleases)

## Common Use Cases

### Generate Release Notes

Automatically generate or enhance release notes when a release is created:

```yaml
---
name: Release Notes Generator
on:
  release:
    types: [created]
permissions:
  contents: write
outputs:
  update-file: true
allowed-paths:
  - CHANGELOG.md
---

When a release is created:
1. Analyze commits since the previous release
2. Categorize changes (features, fixes, docs, etc.)
3. Generate detailed release notes
4. Update the CHANGELOG.md file
```

### Post-Release Validation

Verify release artifacts and documentation after publishing:

```yaml
---
name: Release Validator
on:
  release:
    types: [published]
permissions:
  issues: write
outputs:
  create-issue: true
  add-comment: true
---

After a release is published:
1. Verify release assets are present
2. Check that documentation links are valid
3. Validate version numbers are consistent
4. Create an issue if any problems are found
```

### Announce Releases

Post announcements when releases are published:

```yaml
---
name: Release Announcer
on:
  release:
    types: [published]
permissions:
  discussions: write
outputs:
  create-discussion: true
---

When a new release is published:
1. Extract key highlights from release notes
2. Create a discussion announcing the release
3. Include upgrade instructions if applicable
4. Highlight breaking changes prominently
```

### Update Documentation

Automatically update documentation for new releases:

```yaml
---
name: Docs Version Update
on:
  release:
    types: [published]
permissions:
  contents: write
outputs:
  create-pr: true
allowed-paths:
  - docs/**
---

When a release is published:
1. Update version references in documentation
2. Add new version to version selector
3. Update installation instructions
4. Create a PR with the documentation updates
```

## Multiple Event Types

Listen to multiple release events:

```yaml
on:
  release:
    types: [published, edited]
```

## Available Data

When your agent runs, it has access to:

- **Release tag** - via `${{ github.event.release.tag_name }}`
- **Release name** - via `${{ github.event.release.name }}`
- **Release body** - via `${{ github.event.release.body }}`
- **Release author** - via `${{ github.event.release.author.login }}`
- **Prerelease flag** - via `${{ github.event.release.prerelease }}`
- **Draft flag** - via `${{ github.event.release.draft }}`
- **Release URL** - via `${{ github.event.release.html_url }}`

Access this data using the `gh` CLI:

```bash
# Get release details
gh release view ${{ github.event.release.tag_name }}

# List release assets
gh release view ${{ github.event.release.tag_name }} --json assets
```

## Required Permissions

For read-only operations:

```yaml
permissions:
  contents: read
```

For operations that modify releases or create content:

```yaml
permissions:
  contents: write
```

See [Permissions](../../guide/permissions/) for details.

## Distinguishing Release Types

### Published vs Released

- **`published`** - Fires only when a full release is published
- **`released`** - Fires for both releases and prereleases

Use `published` when you want to exclude prereleases:

```yaml
on:
  release:
    types: [published]  # Only full releases
```

### Prereleases

Handle prereleases separately:

```yaml
---
name: Prerelease Handler
on:
  release:
    types: [prereleased]
permissions:
  discussions: write
outputs:
  create-discussion: true
---

When a prerelease is published:
1. Create announcement in beta-testers discussion category
2. Include known issues and feedback instructions
3. Provide rollback instructions if needed
```

## Best Practices

### Choose Specific Events

Use the most specific event type for your use case:

```yaml
# Use when you want only full releases
on:
  release:
    types: [published]

# Use when you need to handle prereleases too
on:
  release:
    types: [released]

# Use for draft releases before publishing
on:
  release:
    types: [created]
```

### Check Prerelease Status

In your agent instructions, consider checking the prerelease flag:

```yaml
---
name: Conditional Release Handler
on:
  release:
    types: [released]
---

Check if this is a prerelease:
1. If prerelease, post to beta channel
2. If full release, post to general announcement
3. Adjust messaging based on release type
```

### Handle Draft Releases

Draft releases can be modified multiple times before publishing:

```yaml
---
name: Draft Release Reviewer
on:
  release:
    types: [created, edited]
permissions:
  contents: read
outputs:
  add-comment: true
---

When a draft release is created or edited:
1. Validate release notes format
2. Check for required sections
3. Suggest improvements as comments
4. Verify version follows semver
```

## Examples

### Changelog Automation

```yaml
---
name: Changelog Generator
on:
  release:
    types: [published]
permissions:
  contents: write
outputs:
  create-pr: true
allowed-paths:
  - CHANGELOG.md
---

Generate changelog entry for the new release:
1. Get commits between this and previous release
2. Parse conventional commit messages
3. Group by type (feat, fix, docs, etc.)
4. Format as markdown
5. Prepend to CHANGELOG.md
6. Create PR with the update
```

### Release Notification Bot

```yaml
---
name: Release Notifier
on:
  release:
    types: [published]
permissions:
  discussions: write
outputs:
  create-discussion: true
---

Create a release announcement:
1. Format release highlights from body
2. Include download links for assets
3. Post to Announcements discussion category
4. Tag with release version
```

### Version Bump Validator

```yaml
---
name: Version Validator
on:
  release:
    types: [created]
permissions:
  issues: write
outputs:
  add-comment: true
  create-issue: true
---

Validate the new release version:
1. Parse semantic version from tag
2. Compare with package.json version
3. Verify version follows expected pattern
4. Create issue if versions don't match
```

## Combining with Other Triggers

Use release triggers with workflow_dispatch for manual reruns:

```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag to process'
        required: true
        type: string
```

This allows:
- Automatic processing when releases are published
- Manual reprocessing of specific releases

## Next Steps

- Learn about [Workflow Run triggers](workflow-run/) for chaining workflows
- Understand [Permissions](../../guide/permissions/)
- See [Schedule triggers](schedule/) for time-based automation
