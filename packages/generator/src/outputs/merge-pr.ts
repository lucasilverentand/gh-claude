import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class MergePRHandler implements OutputHandler {
  name = "merge-pr";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed for merge-pr
    return null;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Merge Pull Request

Merge a pull request.

**File to create**: \`/tmp/outputs/merge-pr.json\`

For multiple merges, use numbered suffixes: \`merge-pr-1.json\`, \`merge-pr-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "pr_number": number,
  "merge_method": "merge" | "squash" | "rebase",
  "commit_title": "string",
  "commit_message": "string",
  "delete_branch": boolean
}
\`\`\`

**Fields**:
- \`pr_number\` (required): Pull request number to merge
- \`merge_method\` (optional): Merge method - "merge", "squash", or "rebase" (default: "merge")
- \`commit_title\` (optional): Custom merge commit title
- \`commit_message\` (optional): Custom merge commit message
- \`delete_branch\` (optional): Delete branch after merge (default: true)

**Constraints**:
- Maximum merges: ${maxConstraint}
- PR must be mergeable (no conflicts, checks passing if required)
- Merge method must be allowed by repository settings

**Example**:
Create \`/tmp/outputs/merge-pr.json\` with:
\`\`\`json
{
  "pr_number": 123,
  "merge_method": "squash",
  "commit_title": "feat: add new feature (#123)",
  "commit_message": "Adds new feature with comprehensive tests",
  "delete_branch": true
}
\`\`\`

**Important**: Use the Write tool to create this file. The PR will be merged immediately.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute merge-pr output(s)
MERGE_FILES=$(find /tmp/outputs -name "merge-pr*.json" 2>/dev/null || true)

if [ -n "$MERGE_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$MERGE_FILES" | wc -l)
  echo "Found $FILE_COUNT merge-pr output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **merge-pr**: Too many merge files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/merge-pr.txt
    exit 0
  fi`
      : ""
  }

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for merge_file in $MERGE_FILES; do
    echo "Validating $merge_file..."

    # Validate JSON structure
    if ! jq empty "$merge_file" 2>/dev/null; then
      echo "- **merge-pr**: Invalid JSON format in $merge_file" >> /tmp/validation-errors/merge-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    PR_NUMBER=$(jq -r '.pr_number' "$merge_file")
    MERGE_METHOD=$(jq -r '.merge_method // "merge"' "$merge_file")

    # Validate PR number
    if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" = "null" ]; then
      echo "- **merge-pr**: pr_number is required in $merge_file" >> /tmp/validation-errors/merge-pr.txt
      VALIDATION_FAILED=true
      continue
    elif ! echo "$PR_NUMBER" | grep -qE '^[0-9]+$'; then
      echo "- **merge-pr**: pr_number must be a number in $merge_file" >> /tmp/validation-errors/merge-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Validate merge method
    if [[ ! "$MERGE_METHOD" =~ ^(merge|squash|rebase)$ ]]; then
      echo "- **merge-pr**: merge_method must be 'merge', 'squash', or 'rebase' in $merge_file" >> /tmp/validation-errors/merge-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Check if PR exists and is mergeable
    PR_STATE=$(gh api "repos/${runtime.repository}/pulls/$PR_NUMBER" --jq '.state' 2>/dev/null || echo "")
    if [ "$PR_STATE" != "open" ]; then
      echo "- **merge-pr**: PR #$PR_NUMBER is not open (state: $PR_STATE) in $merge_file" >> /tmp/validation-errors/merge-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $merge_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All merge-pr validations passed - executing..."
    for merge_file in $MERGE_FILES; do
      PR_NUMBER=$(jq -r '.pr_number' "$merge_file")
      MERGE_METHOD=$(jq -r '.merge_method // "merge"' "$merge_file")
      COMMIT_TITLE=$(jq -r '.commit_title // empty' "$merge_file")
      COMMIT_MESSAGE=$(jq -r '.commit_message // empty' "$merge_file")
      DELETE_BRANCH=$(jq -r '.delete_branch // true' "$merge_file")

      # Build merge request
      MERGE_OPTS="--$MERGE_METHOD"

      if [ -n "$COMMIT_TITLE" ]; then
        MERGE_OPTS="$MERGE_OPTS --subject "$COMMIT_TITLE""
      fi

      if [ -n "$COMMIT_MESSAGE" ]; then
        MERGE_OPTS="$MERGE_OPTS --body "$COMMIT_MESSAGE""
      fi

      if [ "$DELETE_BRANCH" = "true" ]; then
        MERGE_OPTS="$MERGE_OPTS --delete-branch"
      fi

      # Merge PR via gh CLI
      eval gh pr merge "$PR_NUMBER" $MERGE_OPTS || {
        echo "- **merge-pr**: Failed to merge PR #$PR_NUMBER" >> /tmp/validation-errors/merge-pr.txt
      }
    done
  else
    echo "✗ merge-pr validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new MergePRHandler();
