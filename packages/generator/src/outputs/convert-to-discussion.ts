import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class ConvertToDiscussionHandler implements OutputHandler {
  name = "convert-to-discussion";

  getContextScript(runtime: RuntimeContext): string | null {
    // Fetch available discussion categories
    return `
# Fetch available discussion categories
CATEGORIES_JSON=$(gh api graphql -f query='
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      discussionCategories(first: 20) {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
' -f owner="${runtime.repository.split("/")[0]}" -f name="${runtime.repository.split("/")[1]}" --jq '.data.repository.discussionCategories.nodes' 2>/dev/null || echo '[]')

CATEGORIES_LIST=$(echo "$CATEGORIES_JSON" | jq -r 'map(.name) | join(", ")' 2>/dev/null || echo "No categories available")

cat >> /tmp/context.txt << 'CATEGORIES_EOF'

## Available Discussion Categories

The following discussion categories are available in this repository:
$CATEGORIES_LIST

**Important**: You must use a category that exists. The category name must match exactly.

CATEGORIES_EOF
`;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Convert to Discussion

Convert an issue to a discussion.

**File to create**: \`/tmp/outputs/convert-to-discussion.json\`

For multiple conversions, use numbered suffixes: \`convert-to-discussion-1.json\`, \`convert-to-discussion-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "issue_number": number,
  "category": "string"
}
\`\`\`

**Fields**:
- \`issue_number\` (required): Issue number to convert
- \`category\` (required): Discussion category name (e.g., "Q&A", "Ideas", "General")

**Constraints**:
- Maximum conversions: ${maxConstraint}
- Category must exist in the repository
- Only works on issues, not pull requests
- Original issue will be closed and locked
- All comments are preserved

**Example**:
Create \`/tmp/outputs/convert-to-discussion.json\` with:
\`\`\`json
{
  "issue_number": 123,
  "category": "Q&A"
}
\`\`\`

**Important**: Use the Write tool to create this file. Check available categories in the context above.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;

    return `
# Validate and execute convert-to-discussion output(s)
CONVERT_FILES=$(find /tmp/outputs -name "convert-to-discussion*.json" 2>/dev/null || true)

if [ -n "$CONVERT_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$CONVERT_FILES" | wc -l)
  echo "Found $FILE_COUNT convert-to-discussion output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **convert-to-discussion**: Too many conversion files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/convert-to-discussion.txt
    exit 0
  fi`
      : ""
  }

  # Fetch available categories
  REPO_OWNER="${runtime.repository.split("/")[0]}"
  REPO_NAME="${runtime.repository.split("/")[1]}"

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for convert_file in $CONVERT_FILES; do
    echo "Validating $convert_file..."

    # Validate JSON structure
    if ! jq empty "$convert_file" 2>/dev/null; then
      echo "- **convert-to-discussion**: Invalid JSON format in $convert_file" >> /tmp/validation-errors/convert-to-discussion.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    ISSUE_NUMBER=$(jq -r '.issue_number' "$convert_file")
    CATEGORY=$(jq -r '.category' "$convert_file")

    # Validate required fields
    if [ -z "$ISSUE_NUMBER" ] || [ "$ISSUE_NUMBER" = "null" ]; then
      echo "- **convert-to-discussion**: issue_number is required in $convert_file" >> /tmp/validation-errors/convert-to-discussion.txt
      VALIDATION_FAILED=true
      continue
    elif ! echo "$ISSUE_NUMBER" | grep -qE '^[0-9]+$'; then
      echo "- **convert-to-discussion**: issue_number must be a number in $convert_file" >> /tmp/validation-errors/convert-to-discussion.txt
      VALIDATION_FAILED=true
      continue
    elif [ -z "$CATEGORY" ] || [ "$CATEGORY" = "null" ]; then
      echo "- **convert-to-discussion**: category is required in $convert_file" >> /tmp/validation-errors/convert-to-discussion.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $convert_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All convert-to-discussion validations passed - executing..."
    for convert_file in $CONVERT_FILES; do
      ISSUE_NUMBER=$(jq -r '.issue_number' "$convert_file")
      CATEGORY=$(jq -r '.category' "$convert_file")

      # Get issue node ID
      ISSUE_NODE_ID=$(gh api "repos/${runtime.repository}/issues/$ISSUE_NUMBER" --jq '.node_id' 2>/dev/null)

      if [ -z "$ISSUE_NODE_ID" ] || [ "$ISSUE_NODE_ID" = "null" ]; then
        echo "- **convert-to-discussion**: Failed to get node ID for issue #$ISSUE_NUMBER" >> /tmp/validation-errors/convert-to-discussion.txt
        continue
      fi

      # Get category ID by name
      CATEGORY_ID=$(gh api graphql -f query='
        query($owner: String!, $name: String!, $categoryName: String!) {
          repository(owner: $owner, name: $name) {
            discussionCategories(first: 20) {
              nodes {
                id
                name
              }
            }
          }
        }
      ' -f owner="$REPO_OWNER" -f name="$REPO_NAME" -f categoryName="$CATEGORY" \\
        --jq ".data.repository.discussionCategories.nodes[] | select(.name == \\"$CATEGORY\\") | .id" 2>/dev/null)

      if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" = "null" ]; then
        echo "- **convert-to-discussion**: Category '$CATEGORY' not found in repository" >> /tmp/validation-errors/convert-to-discussion.txt
        continue
      fi

      # Convert issue to discussion via GraphQL mutation
      gh api graphql \\
        -f query='mutation($issueId: ID!, $categoryId: ID!) { convertIssueToDiscussion(input: {issueId: $issueId, categoryId: $categoryId}) { discussion { id url } } }' \\
        -f issueId="$ISSUE_NODE_ID" \\
        -f categoryId="$CATEGORY_ID" || {
        echo "- **convert-to-discussion**: Failed to convert issue #$ISSUE_NUMBER" >> /tmp/validation-errors/convert-to-discussion.txt
      }
    done
  else
    echo "✗ convert-to-discussion validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new ConvertToDiscussionHandler();
