import type { Output, OutputConfig } from '../types/index';

/**
 * Generates the "Available Operations" section for Claude based on enabled outputs.
 * This section documents what operations Claude can perform and how to use them.
 */
export function generateSkillsSection(
  outputs: Record<string, OutputConfig | boolean> | undefined,
  allowedPaths?: string[]
): string {
  if (!outputs || Object.keys(outputs).length === 0) {
    return '';
  }

  const skillDocs = Object.entries(outputs)
    .map(([output, config]) =>
      generateSkillForOutput(
        output as Output,
        typeof config === 'object' ? config : {},
        allowedPaths
      )
    )
    .join('\n\n');

  return `
---
# Available Operations

You are authorized to perform the following operations in this workflow. Use these operations to complete your assigned task.

${skillDocs}
`;
}

/**
 * Generates documentation for a specific output type
 */
export function generateSkillForOutput(
  output: Output,
  config: OutputConfig | Record<string, never>,
  allowedPaths?: string[]
): string {
  switch (output) {
    case 'add-comment':
      return generateAddCommentSkill(config);
    case 'add-label':
      return generateAddLabelSkill(config);
    case 'remove-label':
      return generateRemoveLabelSkill(config);
    case 'create-issue':
      return generateCreateIssueSkill(config);
    case 'create-pr':
      return generateCreatePRSkill(config);
    case 'update-file':
      return generateUpdateFileSkill(config, allowedPaths);
    case 'close-issue':
      return generateCloseIssueSkill(config);
    case 'close-pr':
      return generateClosePRSkill(config);
    default:
      return '';
  }
}

function generateAddCommentSkill(config: OutputConfig | Record<string, never>): string {
  const maxConstraint = 'max' in config && config.max ? config.max : 'unlimited';

  return `## Operation: Add Comment

Add a comment to the current issue or pull request.

**How to use:**
- Use \`mcp__github__issues_addComment\` for issues
- Use \`mcp__github__pulls_addComment\` for pull requests
- Provide the comment body as markdown text
- Be constructive and professional in your comments

**Constraints:**
- Maximum comments: ${maxConstraint}

**Example:**
\`\`\`
Use the mcp__github__issues_addComment tool with:
- owner: repository owner
- repo: repository name
- issue_number: current issue number
- body: "Your markdown comment here"
\`\`\``;
}

function generateAddLabelSkill(_config: OutputConfig | Record<string, never>): string {
  return `## Operation: Add Labels

Add labels to the current issue or pull request.

**How to use:**
- Use \`mcp__github__issues_addLabels\` for issues
- Use \`mcp__github__pulls_addLabels\` for pull requests (using issue_number parameter)
- Provide an array of label names
- Note: Labels must already exist in the repository

**Example:**
\`\`\`
Use the mcp__github__issues_addLabels tool with:
- owner: repository owner
- repo: repository name
- issue_number: current issue/PR number
- labels: ["bug", "needs-triage"]
\`\`\``;
}

function generateRemoveLabelSkill(_config: OutputConfig | Record<string, never>): string {
  return `## Operation: Remove Labels

Remove labels from the current issue or pull request.

**How to use:**
- Use \`mcp__github__issues_removeLabel\` for issues
- Use \`mcp__github__pulls_removeLabel\` for pull requests (using issue_number parameter)
- Provide the label name to remove

**Example:**
\`\`\`
Use the mcp__github__issues_removeLabel tool with:
- owner: repository owner
- repo: repository name
- issue_number: current issue/PR number
- name: "needs-review"
\`\`\``;
}

function generateCreateIssueSkill(config: OutputConfig | Record<string, never>): string {
  const maxConstraint = 'max' in config && config.max ? config.max : 'unlimited';

  return `## Operation: Create Issue

Create a new issue in the repository.

**How to use:**
- Use \`mcp__github__issues_create\`
- Required fields: title and body
- Optional: labels, assignees, milestone

**Constraints:**
- Maximum issues: ${maxConstraint}

**Example:**
\`\`\`
Use the mcp__github__issues_create tool with:
- owner: repository owner
- repo: repository name
- title: "Clear, descriptive title"
- body: "Detailed description with context"
- labels: ["bug", "priority-high"] (optional)
\`\`\``;
}

function generateCreatePRSkill(config: OutputConfig | Record<string, never>): string {
  const maxConstraint = 'max' in config && config.max ? config.max : 'unlimited';
  const signCommits = 'sign' in config && config.sign;

  return `## Operation: Create Pull Request

Create a pull request with code changes.

**Workflow:**
1. Create a new branch from the base branch
2. Make file modifications using the Edit or Write tools
3. Commit changes${signCommits ? ' with signing' : ''}
4. Push the branch
5. Create the pull request using GitHub MCP

**How to use:**
- Use Git commands via Bash tool to create branch, commit, and push
- Use \`mcp__github__pulls_create\` to create the PR
- Required: title, body, head (your branch), base (target branch)

**Constraints:**
- Maximum PRs: ${maxConstraint}
${signCommits ? '- Commits must be signed (configured)' : ''}

**Example workflow:**
\`\`\`bash
# Create and checkout new branch
git checkout -b feature/your-change

# Make changes using Edit tool
# (Use Edit tool to modify files)

# Commit changes
git add .
git commit -m "Description of changes"

# Push branch
git push origin feature/your-change
\`\`\`

Then use \`mcp__github__pulls_create\` with:
- owner: repository owner
- repo: repository name
- title: "Clear PR title"
- body: "Detailed description"
- head: "feature/your-change"
- base: "main" (or appropriate base branch)`;
}

function generateUpdateFileSkill(
  config: OutputConfig | Record<string, never>,
  allowedPaths?: string[]
): string {
  const signCommits = 'sign' in config && config.sign;

  let pathsSection = '';
  if (allowedPaths && allowedPaths.length > 0) {
    const pathsList = allowedPaths.map(p => `  - \`${p}\``).join('\n');
    pathsSection = `
**Allowed paths (glob patterns):**
${pathsList}

**Security notice:** You MUST only modify files matching these patterns. Attempts to modify other files will fail validation.

**Glob pattern examples:**
- \`src/**/*.ts\` matches all TypeScript files in src/ directory and subdirectories
- \`*.md\` matches all markdown files in the root directory
- \`docs/**/*\` matches all files in the docs/ directory`;
  }

  return `## Operation: Update Files

Modify existing files in the repository.

**Workflow:**
1. Use the Read tool to view current file contents
2. Use the Edit tool to make precise changes
3. Commit changes${signCommits ? ' with signing' : ''}
4. Push to the appropriate branch
${pathsSection}

**Constraints:**
${signCommits ? '- Commits must be signed (configured)' : '- Standard commit workflow'}

**Example:**
\`\`\`bash
# Read the file first
# (Use Read tool)

# Make changes
# (Use Edit tool with old_string and new_string)

# Commit
git add <modified-files>
git commit -m "Description of changes"
git push
\`\`\``;
}

function generateCloseIssueSkill(_config: OutputConfig | Record<string, never>): string {
  return `## Operation: Close Issue

Close the current issue.

**How to use:**
- Use \`mcp__github__issues_update\`
- Set state to "closed"
- Optionally provide a reason in a comment before closing

**Example:**
\`\`\`
Use the mcp__github__issues_update tool with:
- owner: repository owner
- repo: repository name
- issue_number: current issue number
- state: "closed"
\`\`\``;
}

function generateClosePRSkill(_config: OutputConfig | Record<string, never>): string {
  return `## Operation: Close Pull Request

Close the current pull request.

**How to use:**
- Use \`mcp__github__pulls_update\`
- Set state to "closed"
- Optionally provide a reason in a comment before closing

**Example:**
\`\`\`
Use the mcp__github__pulls_update tool with:
- owner: repository owner
- repo: repository name
- pull_number: current PR number
- state: "closed"
\`\`\``;
}
