import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class ReopenIssueHandler implements OutputHandler {
  name = "reopen-issue";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed for reopen-issue
    return null;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Reopen Issue

Reopen a closed issue or pull request.

**File to create**: \`/tmp/outputs/reopen-issue.json\`

For multiple reopens, use numbered suffixes: \`reopen-issue-1.json\`, \`reopen-issue-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "issue_number": number,
  "comment": "string"
}
\`\`\`

**Fields**:
- \`issue_number\` (required): Issue or PR number to reopen
- \`comment\` (optional): Comment explaining why the issue is being reopened

**Constraints**:
- Maximum reopens: ${maxConstraint}
- Issue/PR must be in closed state

**Example**:
Create \`/tmp/outputs/reopen-issue.json\` with:
\`\`\`json
{
  "issue_number": 123,
  "comment": "Reopening because the bug has regressed in v2.0"
}
\`\`\`

**Important**: Use the Write tool to create this file. The issue will be reopened immediately.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute reopen-issue output(s)
REOPEN_FILES=$(find /tmp/outputs -name "reopen-issue*.json" 2>/dev/null || true)

if [ -n "$REOPEN_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$REOPEN_FILES" | wc -l)
  echo "Found $FILE_COUNT reopen-issue output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **reopen-issue**: Too many reopen files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/reopen-issue.txt
    exit 0
  fi`
      : ""
  }

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for reopen_file in $REOPEN_FILES; do
    echo "Validating $reopen_file..."

    # Validate JSON structure
    if ! jq empty "$reopen_file" 2>/dev/null; then
      echo "- **reopen-issue**: Invalid JSON format in $reopen_file" >> /tmp/validation-errors/reopen-issue.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    ISSUE_NUMBER=$(jq -r '.issue_number' "$reopen_file")

    # Validate issue number
    if [ -z "$ISSUE_NUMBER" ] || [ "$ISSUE_NUMBER" = "null" ]; then
      echo "- **reopen-issue**: issue_number is required in $reopen_file" >> /tmp/validation-errors/reopen-issue.txt
      VALIDATION_FAILED=true
      continue
    elif ! echo "$ISSUE_NUMBER" | grep -qE '^[0-9]+$'; then
      echo "- **reopen-issue**: issue_number must be a number in $reopen_file" >> /tmp/validation-errors/reopen-issue.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $reopen_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All reopen-issue validations passed - executing..."
    for reopen_file in $REOPEN_FILES; do
      ISSUE_NUMBER=$(jq -r '.issue_number' "$reopen_file")
      COMMENT=$(jq -r '.comment // empty' "$reopen_file")

      # Reopen issue via GitHub API
      gh api "repos/${runtime.repository}/issues/$ISSUE_NUMBER" \\
        -X PATCH \\
        -f state="open" || {
        echo "- **reopen-issue**: Failed to reopen issue #$ISSUE_NUMBER" >> /tmp/validation-errors/reopen-issue.txt
        continue
      }

      # Add comment if provided
      if [ -n "$COMMENT" ]; then
        gh api "repos/${runtime.repository}/issues/$ISSUE_NUMBER/comments" \\
          -X POST \\
          -f body="$COMMENT" || {
          echo "- **reopen-issue**: Failed to add comment to issue #$ISSUE_NUMBER" >> /tmp/validation-errors/reopen-issue.txt
        }
      fi
    done
  else
    echo "✗ reopen-issue validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new ReopenIssueHandler();
