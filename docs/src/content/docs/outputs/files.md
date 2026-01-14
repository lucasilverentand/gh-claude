---
title: Files
description: Enable agents to modify repository files
---

The `update-file` output enables your agent to modify files directly in your repository. This is a powerful capability that allows agents to update documentation, configuration files, or any other text-based content. Because file modifications can have significant impact, this output requires explicit path restrictions through the `allowed-paths` configuration.

## Basic Example

```yaml
name: Documentation Updater
on:
  schedule:
    - cron: '0 0 * * SUN'

permissions:
  contents: write

allowed-paths:
  - docs/**
  - README.md

outputs:
  update-file: true
```

## Configuration Options

```yaml
outputs:
  update-file: true          # boolean | { max, sign } — default: false
  # or with options:
  update-file:
    max: 10                  # number — default: unlimited
    sign: true               # boolean — default: false

# Required alongside update-file:
allowed-paths:
  - 'docs/**'                # glob patterns for allowed file paths
```

**update-file** — Enable file modifications. Requires `contents: write` permission and `allowed-paths`.

**max** — Maximum file operations per run.

**sign** — GPG sign commits.

**allowed-paths** — Glob patterns restricting which files can be modified. Required for security.

## Requirements

Using the `update-file` output requires two mandatory configurations that work together to ensure safe file operations.

The `contents: write` permission is required in the permissions block. Without this permission, the workflow cannot push changes to the repository, and the agent will fail when attempting to modify files.

The `allowed-paths` field specifies which files the agent is permitted to modify using glob patterns. This is a security requirement that prevents agents from making unintended changes to sensitive areas of your repository. The agent can only create or update files that match at least one of the specified patterns. Attempts to modify files outside these patterns will fail validation and the changes will not be applied.

Glob patterns support common wildcards. A double asterisk `**` matches any number of nested directories, while a single asterisk `*` matches any filename or portion within a single directory level. You can specify exact file paths like `README.md` or use combinations like `docs/**/*.md` to match all markdown files within the docs directory and its subdirectories.

## Best Practices

Start with the most restrictive path patterns that allow your agent to accomplish its task. If an agent only needs to update the changelog, specify `CHANGELOG.md` rather than a broader pattern like `*.md`. You can always expand permissions later if needed.

Avoid overly broad patterns that could expose sensitive areas of your repository. Patterns like `**` (all files), `src/**` (source code), or `.github/**` (workflow configurations) grant more access than most documentation or data-focused agents require.

When writing agent instructions, guide the agent to make targeted updates rather than rewriting entire files. For example, instruct the agent to "update the Version section" rather than "rewrite the README". This reduces the risk of unintended content loss and makes changes easier to review.

Consider using commit signing for changes that affect user-facing documentation or configuration that impacts the build process. For auto-generated files like compiled statistics or cache files, signing is typically unnecessary.

## More Examples

<details>
<summary>Example: Changelog maintenance agent</summary>

```yaml
name: Changelog Maintainer
on:
  pull_request:
    types:
      - closed

permissions:
  contents: write

allowed-paths:
  - CHANGELOG.md

outputs:
  update-file: { sign: true }
```

</details>

<details>
<summary>Example: Multi-file documentation updates</summary>

```yaml
name: Docs Sync
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  contents: write

allowed-paths:
  - docs/**
  - README.md
  - CONTRIBUTING.md

outputs:
  update-file: true
```

</details>

<details>
<summary>Example: Configuration file generator</summary>

```yaml
name: Config Generator
on:
  workflow_dispatch:
    inputs:
      environment:
        description: Target environment
        required: true
        type: choice
        options:
          - development
          - staging
          - production

permissions:
  contents: write

allowed-paths:
  - config/*.json
  - .github/workflows/generated-*.yml

outputs:
  update-file: true
```

</details>

<details>
<summary>Example: Version bump across multiple files</summary>

```yaml
name: Version Bumper
on:
  release:
    types:
      - published

permissions:
  contents: write

allowed-paths:
  - package.json
  - version.txt
  - src/version.ts

outputs:
  update-file: { sign: true }
```

</details>
