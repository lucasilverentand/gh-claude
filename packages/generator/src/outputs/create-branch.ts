import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class CreateBranchHandler implements OutputHandler {
  name = "create-branch";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed for create-branch
    return null;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Create Branch

Create a new branch in the repository.

**File to create**: \`/tmp/outputs/create-branch.json\`

For multiple branches, use numbered suffixes: \`create-branch-1.json\`, \`create-branch-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "branch": "string",
  "from_ref": "string",
  "from_sha": "string"
}
\`\`\`

**Fields**:
- \`branch\` (required): Branch name to create (e.g., "feature/new-feature")
- \`from_ref\` (optional): Branch/tag to create from (default: "main")
- \`from_sha\` (optional): Specific commit SHA to create from (overrides from_ref)

**Constraints**:
- Maximum branches: ${maxConstraint}
- Branch name must be valid (no spaces, starts with letter/number)
- Branch must not already exist

**Example**:
Create \`/tmp/outputs/create-branch.json\` with:
\`\`\`json
{
  "branch": "feature/new-feature",
  "from_ref": "main"
}
\`\`\`

**Important**: Use the Write tool to create this file. The branch will be created immediately.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute create-branch output(s)
BRANCH_FILES=$(find /tmp/outputs -name "create-branch*.json" 2>/dev/null || true)

if [ -n "$BRANCH_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$BRANCH_FILES" | wc -l)
  echo "Found $FILE_COUNT create-branch output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **create-branch**: Too many branch files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/create-branch.txt
    exit 0
  fi`
      : ""
  }

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for branch_file in $BRANCH_FILES; do
    echo "Validating $branch_file..."

    # Validate JSON structure
    if ! jq empty "$branch_file" 2>/dev/null; then
      echo "- **create-branch**: Invalid JSON format in $branch_file" >> /tmp/validation-errors/create-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    BRANCH=$(jq -r '.branch' "$branch_file")

    # Validate required fields
    if [ -z "$BRANCH" ] || [ "$BRANCH" = "null" ]; then
      echo "- **create-branch**: branch is required in $branch_file" >> /tmp/validation-errors/create-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Validate branch name format
    if [[ ! "$BRANCH" =~ ^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$ ]]; then
      echo "- **create-branch**: Invalid branch name '$BRANCH' in $branch_file" >> /tmp/validation-errors/create-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Check if branch already exists
    if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
      echo "- **create-branch**: Branch '$BRANCH' already exists in $branch_file" >> /tmp/validation-errors/create-branch.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $branch_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All create-branch validations passed - executing..."
    for branch_file in $BRANCH_FILES; do
      BRANCH=$(jq -r '.branch' "$branch_file")
      FROM_REF=$(jq -r '.from_ref // "main"' "$branch_file")
      FROM_SHA=$(jq -r '.from_sha // empty' "$branch_file")

      # Determine SHA to branch from
      if [ -n "$FROM_SHA" ]; then
        TARGET_SHA="$FROM_SHA"
      else
        # Get SHA of from_ref
        TARGET_SHA=$(gh api "repos/${runtime.repository}/git/refs/heads/$FROM_REF" --jq '.object.sha' 2>/dev/null)

        if [ -z "$TARGET_SHA" ] || [ "$TARGET_SHA" = "null" ]; then
          # Try as a tag
          TARGET_SHA=$(gh api "repos/${runtime.repository}/git/refs/tags/$FROM_REF" --jq '.object.sha' 2>/dev/null)
        fi

        if [ -z "$TARGET_SHA" ] || [ "$TARGET_SHA" = "null" ]; then
          echo "- **create-branch**: Failed to resolve from_ref '$FROM_REF'" >> /tmp/validation-errors/create-branch.txt
          continue
        fi
      fi

      # Create branch via GitHub API
      gh api "repos/${runtime.repository}/git/refs" \\
        -X POST \\
        -f ref="refs/heads/$BRANCH" \\
        -f sha="$TARGET_SHA" || {
        echo "- **create-branch**: Failed to create branch '$BRANCH'" >> /tmp/validation-errors/create-branch.txt
      }
    done
  else
    echo "✗ create-branch validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new CreateBranchHandler();
