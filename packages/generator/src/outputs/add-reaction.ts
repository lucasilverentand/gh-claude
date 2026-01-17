import type { OutputConfig } from "@repo-agents/types";
import type { OutputHandler, RuntimeContext } from "./base";

class AddReactionHandler implements OutputHandler {
  name = "add-reaction";

  getContextScript(_runtime: RuntimeContext): string | null {
    // No dynamic context needed but provide info about available reactions
    return `
cat >> /tmp/context.txt << 'REACTIONS_EOF'

## Available Reactions

The following emoji reactions are supported:
- \`+1\` - Thumbs up
- \`-1\` - Thumbs down
- \`laugh\` - Laugh
- \`confused\` - Confused
- \`heart\` - Heart
- \`hooray\` - Hooray/Party
- \`rocket\` - Rocket
- \`eyes\` - Eyes

**Important**: Use the exact reaction name (e.g., "+1", "rocket", "eyes").

REACTIONS_EOF
`;
  }

  generateSkill(config: OutputConfig): string {
    const maxConstraint = config.max || "unlimited";

    return `## Skill: Add Reaction

Add an emoji reaction to an issue, PR, or comment.

**File to create**: \`/tmp/outputs/add-reaction.json\`

For multiple reactions, use numbered suffixes: \`add-reaction-1.json\`, \`add-reaction-2.json\`, etc.

**JSON Schema**:
\`\`\`json
{
  "issue_number": number,
  "comment_id": number,
  "reaction": "string"
}
\`\`\`

**Fields**:
- \`issue_number\` (optional): Issue or PR number to react to
- \`comment_id\` (optional): Comment ID to react to
- \`reaction\` (required): Reaction emoji - "+1", "-1", "laugh", "confused", "heart", "hooray", "rocket", or "eyes"

**Note**: Specify either \`issue_number\` OR \`comment_id\`, not both.

**Constraints**:
- Maximum reactions: ${maxConstraint}
- Must use supported reaction types
- Can only react to accessible content

**Examples**:

React to an issue:
\`\`\`json
{
  "issue_number": 123,
  "reaction": "eyes"
}
\`\`\`

React to a comment:
\`\`\`json
{
  "comment_id": 456789,
  "reaction": "+1"
}
\`\`\`

**Important**: Use the Write tool to create this file.`;
  }

  generateValidationScript(config: OutputConfig, runtime: RuntimeContext): string {
    const maxConstraint = config.max;
    const validReactions = ["+1", "-1", "laugh", "confused", "heart", "hooray", "rocket", "eyes"];

    return `
# Validate and execute add-reaction output(s)
REACTION_FILES=$(find /tmp/outputs -name "add-reaction*.json" 2>/dev/null || true)

if [ -n "$REACTION_FILES" ]; then
  # Count files
  FILE_COUNT=$(echo "$REACTION_FILES" | wc -l)
  echo "Found $FILE_COUNT add-reaction output file(s)"

  # Check max constraint
  ${
    maxConstraint
      ? `
  if [ "$FILE_COUNT" -gt ${maxConstraint} ]; then
    echo "- **add-reaction**: Too many reaction files ($FILE_COUNT). Maximum allowed: ${maxConstraint}" > /tmp/validation-errors/add-reaction.txt
    exit 0
  fi`
      : ""
  }

  # Valid reactions
  VALID_REACTIONS="${validReactions.join("|")}"

  # Phase 1: Validate all files
  VALIDATION_FAILED=false
  for reaction_file in $REACTION_FILES; do
    echo "Validating $reaction_file..."

    # Validate JSON structure
    if ! jq empty "$reaction_file" 2>/dev/null; then
      echo "- **add-reaction**: Invalid JSON format in $reaction_file" >> /tmp/validation-errors/add-reaction.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Extract fields
    ISSUE_NUMBER=$(jq -r '.issue_number // empty' "$reaction_file")
    COMMENT_ID=$(jq -r '.comment_id // empty' "$reaction_file")
    REACTION=$(jq -r '.reaction' "$reaction_file")

    # Validate reaction
    if [ -z "$REACTION" ] || [ "$REACTION" = "null" ]; then
      echo "- **add-reaction**: reaction is required in $reaction_file" >> /tmp/validation-errors/add-reaction.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Validate reaction type
    if ! echo "$REACTION" | grep -qE "^($VALID_REACTIONS)$"; then
      echo "- **add-reaction**: Invalid reaction '$REACTION'. Must be one of: $VALID_REACTIONS in $reaction_file" >> /tmp/validation-errors/add-reaction.txt
      VALIDATION_FAILED=true
      continue
    fi

    # Validate exactly one target is specified
    if [ -z "$ISSUE_NUMBER" ] && [ -z "$COMMENT_ID" ]; then
      echo "- **add-reaction**: Either issue_number or comment_id must be specified in $reaction_file" >> /tmp/validation-errors/add-reaction.txt
      VALIDATION_FAILED=true
      continue
    elif [ -n "$ISSUE_NUMBER" ] && [ -n "$COMMENT_ID" ]; then
      echo "- **add-reaction**: Cannot specify both issue_number and comment_id in $reaction_file" >> /tmp/validation-errors/add-reaction.txt
      VALIDATION_FAILED=true
      continue
    fi

    echo "✓ Validation passed for $reaction_file"
  done

  # Phase 2: Execute only if all validations passed
  if [ "$VALIDATION_FAILED" = false ]; then
    echo "✓ All add-reaction validations passed - executing..."
    for reaction_file in $REACTION_FILES; do
      ISSUE_NUMBER=$(jq -r '.issue_number // empty' "$reaction_file")
      COMMENT_ID=$(jq -r '.comment_id // empty' "$reaction_file")
      REACTION=$(jq -r '.reaction' "$reaction_file")

      # Add reaction to issue or comment
      if [ -n "$ISSUE_NUMBER" ]; then
        gh api "repos/${runtime.repository}/issues/$ISSUE_NUMBER/reactions" \\
          -X POST \\
          -f content="$REACTION" || {
          echo "- **add-reaction**: Failed to add reaction to issue #$ISSUE_NUMBER" >> /tmp/validation-errors/add-reaction.txt
        }
      else
        gh api "repos/${runtime.repository}/issues/comments/$COMMENT_ID/reactions" \\
          -X POST \\
          -f content="$REACTION" || {
          echo "- **add-reaction**: Failed to add reaction to comment #$COMMENT_ID" >> /tmp/validation-errors/add-reaction.txt
        }
      fi
    done
  else
    echo "✗ add-reaction validation failed - skipping execution (atomic operation)"
  fi
fi
`;
  }
}

export const handler = new AddReactionHandler();
