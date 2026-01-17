---
title: Pull Requests
description: Enable agents to create, review, merge, and manage pull requests
---

The pull request outputs allow your agent to fully manage the PR lifecycle including creation, review requests, approvals, merging, and closing. These are powerful capabilities for automating code changes, documentation updates, maintenance tasks, and PR workflows.

## Basic Example

```yaml
name: Documentation Updater
on:
  schedule:
    - cron: '0 0 * * MON'

permissions:
  contents: write
  pull_requests: write

outputs:
  create-pr: true
```

## Available Outputs

### create-pr

Create pull requests with code changes, branch creation, and commit signing support.

```yaml
outputs:
  create-pr: true            # boolean | { max, sign } — default: false
  # or with options:
  create-pr:
    max: 1                   # number — default: 10
    sign: true               # boolean — default: false
```

**max** — Maximum PRs to create per run.

**sign** — GPG sign commits in created PRs.

### close-pr

Close pull requests without merging them.

```yaml
outputs:
  close-pr: true             # boolean — default: false
```

### merge-pr

Merge pull requests with configurable merge methods (merge, squash, rebase).

```yaml
outputs:
  merge-pr: true             # boolean — default: false
```

### approve-pr

Approve pull requests on behalf of the agent.

```yaml
outputs:
  approve-pr: true           # boolean — default: false
```

### request-review

Request reviews from users or teams on pull requests.

```yaml
outputs:
  request-review: true       # boolean — default: false
```

## Permission Requirements

Creating pull requests requires both `contents: write` and `pull_requests: write` permissions. The contents permission is necessary because the agent needs to create branches and commit files, while the pull_requests permission allows the actual PR creation.

```yaml
permissions:
  contents: write
  pull_requests: write
```

Closing pull requests only requires `pull_requests: write` since no file modifications are involved.

## How Agents Create Pull Requests

When an agent wants to create a pull request, it writes a JSON file to `/tmp/outputs/create-pr.json` containing the branch name, title, body, and an array of files to include. The execution system then processes this file, creates the branch, commits the files, and opens the pull request.

The JSON structure requires a `branch` field for the new branch name, a `title` for the PR, a `body` with the description, and a `files` array where each entry has a `path` and `content`. An optional `base` field specifies the target branch (defaults to the repository's default branch).

For multiple pull requests, the agent creates numbered files like `create-pr-1.json`, `create-pr-2.json`, and so on.

## Best Practices

Keep pull request creation limits low. Setting `max: 1` ensures each agent run produces one focused, reviewable change rather than a batch of PRs that could overwhelm reviewers or cause merge conflicts.

Use descriptive branch names that follow your team's conventions. Branch names should indicate the type of change and provide context, such as `docs/update-api-reference` or `fix/validation-error-handling`.

Write meaningful PR descriptions that explain not just what changed but why. Include any relevant context that reviewers need to understand the automated change.

Consider combining `create-pr` with `add-label` to automatically categorize your automated PRs. This makes it easy to filter and track agent-generated changes in your repository.

Enable commit signing for production repositories where traceability and verification are important. Signed commits provide an audit trail and help distinguish automated changes from manual ones.

Use `close-pr` sparingly and consider always pairing it with `add-comment` to explain why the PR is being closed. Unexplained closures can confuse contributors.

## Examples

<details>
<summary>Example: Weekly documentation sync</summary>

```yaml
name: Weekly Docs Sync
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  contents: write
  pull_requests: write

outputs:
  create-pr: { max: 1, sign: true }
  add-label: true
```

```markdown
Review the README and documentation files for outdated information.
Compare against the current codebase and update any inconsistencies.

If changes are needed, create a single PR with all updates.
Use the branch name "docs/weekly-sync-YYYY-MM-DD".
Add the "documentation" label to the PR.
```

</details>

<details>
<summary>Example: Dependency update automation</summary>

```yaml
name: Dependency Updater
on:
  schedule:
    - cron: '0 0 * * 0'

permissions:
  contents: write
  pull_requests: write

outputs:
  create-pr: { max: 1, sign: true }
  add-label: true
```

```markdown
Check for outdated dependencies in package.json.
If security vulnerabilities exist, prioritize those updates.

Create a PR with the updated package.json and lock file.
Title should follow: "chore(deps): update dependencies [date]"
Include a summary of what was updated in the PR body.
Add labels: dependencies, automated
```

</details>

<details>
<summary>Example: PR triage with close capability</summary>

```yaml
name: PR Triage
on:
  pull_request:
    types:
      - opened

permissions:
  pull_requests: write

outputs:
  close-pr: true
  add-comment: { max: 1 }
```

```markdown
Review the incoming pull request for basic requirements:
- Has a meaningful title
- Has a description explaining the changes
- Follows the contribution guidelines

If the PR is clearly spam or violates guidelines:
1. Add a polite comment explaining the issue
2. Close the PR

Otherwise, do nothing and let human reviewers handle it.
```

</details>

<details>
<summary>Example: Code generation from schema changes</summary>

```yaml
name: Schema Codegen
on:
  pull_request:
    types:
      - opened
      - synchronize
    paths:
      - 'schemas/**'

permissions:
  contents: write
  pull_requests: write

outputs:
  create-pr: { max: 1 }
```

```markdown
When schema files change, regenerate the TypeScript types.

Read the schema files from schemas/ directory.
Generate corresponding TypeScript interfaces.
Write the generated code to src/generated/types.ts.

Create a PR titled "chore: regenerate types from schema"
Reference the triggering PR in the description.
```

</details>
