import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class DeleteBranchHandler implements OutputHandler {
  name = "delete-branch";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed for delete-branch
    return null;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Delete Branch

Delete a branch from the repository.

**File to create**: \`/tmp/outputs/delete-branch.json\`

For multiple deletions, use numbered suffixes: \`delete-branch-1.json\`, \`delete-branch-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "branch": "string"
}
\`\`\`

**Fields**:
- \`branch\` (required): Branch name to delete (e.g., "feature/old-feature")

**Constraints**:
- Maximum deletions: ${maxConstraint}
- Cannot delete protected branches (main, master, develop, etc.)
- Cannot delete the default branch

**Example**:
Create \`/tmp/outputs/delete-branch.json\` with:
\`\`\`json
{
  "branch": "feature/old-feature"
}
\`\`\`

**Important**: Use the Write tool to create this file. The branch will be permanently deleted.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute delete-branch output(s)
DELETE_FILES=$(find /tmp/outputs -name "delete-branch*.json" 2>/dev/null || true)

if [ -n "$DELETE_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$DELETE_FILES" | wc -l)
  echo "Found $FILE_COUNT delete-branch output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **delete-branch**: Too many deletion files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/delete-branch.txt
    exit 0
  fi`
      : ""
  }

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for delete_file in $DELETE_FILES; do
    echo "Validating $delete_file..."

    # Validate JSON structure
    if ! jq empty "$delete_file" 2>/dev/null; then
      echo "- **delete-branch**: Invalid JSON format in $delete_file" >> /tmp/validation-errors/delete-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    BRANCH=$(jq -r '.branch' "$delete_file")

    # Validate required fields
    if [ -z "$BRANCH" ] || [ "$BRANCH" = "null" ]; then
      echo "- **delete-branch**: branch is required in $delete_file" >> /tmp/validation-errors/delete-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Prevent deletion of protected branches
    if [[ "$BRANCH" =~ ^(main|master|develop|staging|production)$ ]]; then
      echo "- **delete-branch**: Cannot delete protected branch '$BRANCH' in $delete_file" >> /tmp/validation-errors/delete-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $delete_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All delete-branch validations passed - executing..."
    for delete_file in $DELETE_FILES; do
      BRANCH=$(jq -r '.branch' "$delete_file")

      # Delete branch via GitHub API
      gh api "repos/${runtime.repository}/git/refs/heads/$BRANCH" -X DELETE || {
        echo "- **delete-branch**: Failed to delete branch '$BRANCH'" >> /tmp/validation-errors/delete-branch.txt
      }
    done
  else
    echo "✗ delete-branch validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new DeleteBranchHandler();
