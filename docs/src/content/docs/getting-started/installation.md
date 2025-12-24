---
title: Installation
description: How to install gh-claude
---

## Prerequisites

Before installing gh-claude, ensure you have:

- **Node.js 20.0.0 or higher**
- **GitHub CLI** (`gh`) installed and authenticated
- An **Anthropic API key** for Claude

## Installing the Extension

Install gh-claude as a GitHub CLI extension:

```bash
gh extension install lucasilverentand/gh-claude
```

## Verify Installation

Check that the extension is installed:

```bash
gh claude --version
```

You should see the version number displayed.

## Setting Up API Key

gh-claude requires an Anthropic API key to use Claude. You'll need to add this as a repository secret:

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your repository:

```bash
gh secret set ANTHROPIC_API_KEY
```

When prompted, paste your API key.

## GitHub App Setup

A GitHub App is **required** for gh-claude workflows. The app enables:
- **Branded identity**: Commits and comments appear as your app (e.g., "Claude[bot]")
- **CI triggering**: PRs created by Claude can trigger CI workflows
- **Proper permissions**: Fine-grained access control for repository operations

### Quick Setup

Run the interactive setup command:

```bash
gh claude setup-app
```

This will guide you through:
1. Creating a new GitHub App
2. Configuring the required permissions
3. Generating and storing the private key
4. Installing the app on your repository

### What You'll Need

The setup process creates these secrets:
- `GH_APP_ID`: Your GitHub App's ID
- `GH_APP_PRIVATE_KEY`: Your GitHub App's private key

These can be stored at the organization level (shared across repos) or repository level.

### Required App Permissions

When creating your GitHub App, configure these repository permissions:
- **Contents**: Read and write
- **Issues**: Read and write
- **Pull requests**: Read and write
- **Metadata**: Read-only (auto-selected)
- **Workflows**: Read and write (enables CI triggering)

For detailed instructions, see the [Authentication Guide](../../guide/authentication/).

## Next Steps

Now that you have gh-claude installed and configured, proceed to the [Quick Start](../quick-start/) guide to create your first agent.
