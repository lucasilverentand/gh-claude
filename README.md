# gh-claude

[![Build & Test](https://github.com/lucasilverentand/gh-claude/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasilverentand/gh-claude/actions/workflows/ci.yml)
[![Release Please](https://github.com/lucasilverentand/gh-claude/actions/workflows/release-please.yml/badge.svg)](https://github.com/lucasilverentand/gh-claude/actions/workflows/release-please.yml)
[![Docs](https://github.com/lucasilverentand/gh-claude/actions/workflows/deploy-docs.yml/badge.svg)](https://lucasilverentand.github.io/gh-claude)

**Transform natural language markdown into intelligent GitHub Actions workflows powered by Claude AI.**

Write what you want done in markdown – Claude figures out how to do it.

**[📚 Documentation](https://lucasilverentand.github.io/gh-claude)** • **[🚀 Getting Started](GETTING_STARTED.md)** • **[💡 Examples](https://lucasilverentand.github.io/gh-claude/examples/)**

---

## What is gh-claude?

gh-claude lets you automate repository tasks by writing simple instructions instead of complex YAML. Create AI-powered agents that automatically triage issues, review pull requests, generate reports, and more.

**Traditional GitHub Actions:**
```yaml
# Complex YAML configuration with multiple steps...
```

**With gh-claude:**
```markdown
---
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  issues: write
outputs:
  add-comment: true
  add-label: true
---

Analyze this issue and add appropriate labels (bug, feature, docs).
Welcome the contributor with a friendly message!
```

## Quick Start

```bash
# Install
gh extension install lucasilverentand/gh-claude

# Initialize in your repository
gh claude init --examples

# Set up authentication
gh claude setup

# Compile agents to workflows
gh claude compile

# Commit and push
git add .github/
git commit -m "Add Claude agents"
git push
```

**[→ Full getting started guide](GETTING_STARTED.md)**

## What Can You Build?

- **Issue Triage** – Auto-label and welcome new issues
- **PR Review** – Provide initial code review feedback
- **Activity Reports** – Daily/weekly summaries of repository activity
- **Stale Issue Cleanup** – Close inactive issues with helpful messages
- **Documentation Updates** – Automated doc improvements
- **Custom Workflows** – Anything you can describe in natural language

**[→ See examples](https://lucasilverentand.github.io/gh-claude/examples/)**

## Key Features

- ✅ **Natural language workflows** – Write instructions in markdown, not YAML
- ✅ **Safe by default** – Read-only unless explicitly granted permissions
- ✅ **Validated outputs** – All actions go through validation
- ✅ **Flexible triggers** – Issues, PRs, discussions, schedules, manual dispatch
- ✅ **Data collection** – Gather repo activity for analysis
- ✅ **Self-healing** – Auto-detects misconfigurations and creates fix instructions

## Documentation

**[📚 Full Documentation](https://lucasilverentand.github.io/gh-claude)**

Quick links:
- [Getting Started](GETTING_STARTED.md)
- [How It Works](https://lucasilverentand.github.io/gh-claude/guide/how-it-works/)
- [CLI Reference](https://lucasilverentand.github.io/gh-claude/cli/)
- [Examples](https://lucasilverentand.github.io/gh-claude/examples/)
- [Security](https://lucasilverentand.github.io/gh-claude/reference/security/)

## Development

```bash
# Clone and install
git clone https://github.com/lucasilverentand/gh-claude
cd gh-claude
bun install

# Build and test
bun run build
bun test

# Install locally
gh extension install .
```

See [CLAUDE.md](CLAUDE.md) for development guidance.

## License

MIT

## Links

- **[📚 Documentation](https://lucasilverentand.github.io/gh-claude)**
- **[🐛 Issue Tracker](https://github.com/lucasilverentand/gh-claude/issues)**
- **[🤖 Anthropic Claude](https://www.anthropic.com/)**
- **[⚡ GitHub CLI](https://cli.github.com/)**

---

Built with ❤️ using [Anthropic Claude](https://www.anthropic.com/claude) and [GitHub CLI](https://cli.github.com/)
