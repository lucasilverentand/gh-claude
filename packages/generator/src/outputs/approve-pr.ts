import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class ApprovePRHandler implements OutputHandler {
  name = "approve-pr";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed for approve-pr
    return null;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Approve Pull Request

Leave an approving review on a pull request.

**File to create**: \`/tmp/outputs/approve-pr.json\`

For multiple approvals, use numbered suffixes: \`approve-pr-1.json\`, \`approve-pr-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "pr_number": number,
  "body": "string"
}
\`\`\`

**Fields**:
- \`pr_number\` (required): Pull request number to approve
- \`body\` (optional): Review comment explaining the approval

**Constraints**:
- Maximum approvals: ${maxConstraint}
- Cannot approve your own PR

**Example**:
Create \`/tmp/outputs/approve-pr.json\` with:
\`\`\`json
{
  "pr_number": 123,
  "body": "LGTM! All checks pass and changes are well-tested."
}
\`\`\`

**Important**: Use the Write tool to create this file. This will create an approving review.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute approve-pr output(s)
APPROVE_FILES=$(find /tmp/outputs -name "approve-pr*.json" 2>/dev/null || true)

if [ -n "$APPROVE_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$APPROVE_FILES" | wc -l)
  echo "Found $FILE_COUNT approve-pr output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **approve-pr**: Too many approval files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/approve-pr.txt
    exit 0
  fi`
      : ""
  }

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for approve_file in $APPROVE_FILES; do
    echo "Validating $approve_file..."

    # Validate JSON structure
    if ! jq empty "$approve_file" 2>/dev/null; then
      echo "- **approve-pr**: Invalid JSON format in $approve_file" >> /tmp/validation-errors/approve-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    PR_NUMBER=$(jq -r '.pr_number' "$approve_file")

    # Validate PR number
    if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" = "null" ]; then
      echo "- **approve-pr**: pr_number is required in $approve_file" >> /tmp/validation-errors/approve-pr.txt
      VALIDATION_FAILED=true
      continue
    elif ! echo "$PR_NUMBER" | grep -qE '^[0-9]+$'; then
      echo "- **approve-pr**: pr_number must be a number in $approve_file" >> /tmp/validation-errors/approve-pr.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $approve_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All approve-pr validations passed - executing..."
    for approve_file in $APPROVE_FILES; do
      PR_NUMBER=$(jq -r '.pr_number' "$approve_file")
      BODY=$(jq -r '.body // "Automated approval"' "$approve_file")

      # Create approving review via GitHub API
      gh api "repos/${runtime.repository}/pulls/$PR_NUMBER/reviews" \\
        -X POST \\
        -f body="$BODY" \\
        -f event="APPROVE" || {
        echo "- **approve-pr**: Failed to approve PR #$PR_NUMBER" >> /tmp/validation-errors/approve-pr.txt
      }
    done
  else
    echo "✗ approve-pr validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new ApprovePRHandler();
