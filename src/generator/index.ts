import { writeFile } from 'fs/promises';
import yaml from 'js-yaml';
import { AgentDefinition } from '../types';
import { agentNameToWorkflowName } from '../cli/utils/files';

export class WorkflowGenerator {
  generate(agent: AgentDefinition): string {
    const workflow: any = {
      name: agent.name,
      on: this.generateTriggers(agent),
    };

    if (agent.permissions) {
      workflow.permissions = agent.permissions;
    }

    workflow.jobs = {
      'validate': {
        'runs-on': 'ubuntu-latest',
        outputs: {
          'should-run': '${{ steps.validation.outputs.should-run }}',
        },
        steps: [
          {
            name: 'Validate trigger',
            id: 'validation',
            env: {
              GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
              ANTHROPIC_API_KEY: '${{ secrets.ANTHROPIC_API_KEY }}',
              CLAUDE_ACCESS_TOKEN: '${{ secrets.CLAUDE_ACCESS_TOKEN }}',
            },
            run: this.generateValidationStep(agent),
          },
        ],
      },
      'claude-agent': {
        'runs-on': 'ubuntu-latest',
        needs: 'validate',
        if: "needs.validate.outputs.should-run == 'true'",
        steps: [
          {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
          {
            name: 'Setup Node.js',
            uses: 'actions/setup-node@v4',
            with: {
              'node-version': '20',
            },
          },
          {
            name: 'Run Claude Agent',
            run: this.generateClaudeStep(agent),
            env: this.generateEnvironment(agent),
          },
        ],
      },
    };

    return yaml.dump(workflow, {
      lineWidth: -1,
      noRefs: true,
    });
  }

  private generateTriggers(agent: AgentDefinition): any {
    const triggers: any = {};

    if (agent.on.issues) {
      triggers.issues = agent.on.issues;
    }

    if (agent.on.pull_request) {
      triggers.pull_request = agent.on.pull_request;
    }

    if (agent.on.discussion) {
      triggers.discussion = agent.on.discussion;
    }

    if (agent.on.schedule) {
      triggers.schedule = agent.on.schedule;
    }

    if (agent.on.workflow_dispatch) {
      triggers.workflow_dispatch = agent.on.workflow_dispatch;
    }

    if (agent.on.repository_dispatch) {
      triggers.repository_dispatch = agent.on.repository_dispatch;
    }

    return triggers;
  }

  private generateValidationStep(agent: AgentDefinition): string {
    const allowedUsers = [...(agent.allowedUsers || []), ...(agent.allowedActors || [])];
    const allowedLabels = agent.triggerLabels || [];
    const rateLimitMinutes = agent.rateLimitMinutes ?? 5;

    return `#!/bin/bash
set -e

echo "=== Pre-validation Checks ==="

# 1. Secret validation - Verify either ANTHROPIC_API_KEY or CLAUDE_ACCESS_TOKEN is set
echo "Checking secrets..."
if [ -z "\${ANTHROPIC_API_KEY}" ] && [ -z "\${CLAUDE_ACCESS_TOKEN}" ]; then
  echo "::error::No Claude authentication found. Please set either ANTHROPIC_API_KEY (for API access) or CLAUDE_ACCESS_TOKEN (for subscription) in your repository secrets."
  echo "should-run=false" >> $GITHUB_OUTPUT
  exit 0
fi

if [ -n "\${ANTHROPIC_API_KEY}" ]; then
  echo "✓ ANTHROPIC_API_KEY is configured (API access)"
fi
if [ -n "\${CLAUDE_ACCESS_TOKEN}" ]; then
  echo "✓ CLAUDE_ACCESS_TOKEN is configured (subscription access)"
fi

# 2. User authorization - Check if the user is allowed to trigger the agent
echo "Checking user authorization..."
ACTOR="\${{ github.actor }}"
EVENT_NAME="\${{ github.event_name }}"

# Get user's association with the repository
USER_ASSOCIATION=$(gh api "repos/\${{ github.repository }}/collaborators/\${ACTOR}/permission" --jq '.permission' 2>/dev/null || echo "none")

# Check if user is org member (for org repos)
IS_ORG_MEMBER="false"
ORG_NAME=$(echo "\${{ github.repository }}" | cut -d'/' -f1)
if gh api "orgs/\${ORG_NAME}/members/\${ACTOR}" >/dev/null 2>&1; then
  IS_ORG_MEMBER="true"
fi

# Allowed if: admin, write access, org member, or in explicit allow list
ALLOWED_USERS="${allowedUsers.join(' ')}"
IS_ALLOWED="false"

if [ "\${USER_ASSOCIATION}" = "admin" ] || [ "\${USER_ASSOCIATION}" = "write" ]; then
  IS_ALLOWED="true"
  echo "✓ User has \${USER_ASSOCIATION} permission"
elif [ "\${IS_ORG_MEMBER}" = "true" ]; then
  IS_ALLOWED="true"
  echo "✓ User is organization member"
elif [ -n "\${ALLOWED_USERS}" ]; then
  for allowed in \${ALLOWED_USERS}; do
    if [ "\${ACTOR}" = "\${allowed}" ]; then
      IS_ALLOWED="true"
      echo "✓ User is in allowed users list"
      break
    fi
  done
fi

if [ "\${IS_ALLOWED}" = "false" ]; then
  echo "::warning::User @\${ACTOR} is not authorized to trigger this agent"
  echo "should-run=false" >> $GITHUB_OUTPUT
  exit 0
fi

# 3. Label/trigger validation - Check if required labels are present (if configured)
REQUIRED_LABELS="${allowedLabels.join(' ')}"
if [ -n "\${REQUIRED_LABELS}" ]; then
  echo "Checking required labels..."

  ISSUE_NUMBER="\${{ github.event.issue.number }}\${{ github.event.pull_request.number }}"
  if [ -n "\${ISSUE_NUMBER}" ]; then
    CURRENT_LABELS=$(gh api "repos/\${{ github.repository }}/issues/\${ISSUE_NUMBER}" --jq '.labels[].name' 2>/dev/null | tr '\\n' ' ' || echo "")

    LABEL_FOUND="false"
    for required in \${REQUIRED_LABELS}; do
      if echo "\${CURRENT_LABELS}" | grep -qw "\${required}"; then
        LABEL_FOUND="true"
        echo "✓ Found required label: \${required}"
        break
      fi
    done

    if [ "\${LABEL_FOUND}" = "false" ]; then
      echo "::notice::Required label not found. Need one of: \${REQUIRED_LABELS}"
      echo "should-run=false" >> $GITHUB_OUTPUT
      exit 0
    fi
  fi
else
  echo "✓ No label requirements configured"
fi

# 4. Rate limiting - Check for recent agent runs
echo "Checking rate limit..."
RATE_LIMIT_MINUTES=${rateLimitMinutes}

# Get recent workflow runs for this workflow
RECENT_RUNS=$(gh api "repos/\${{ github.repository }}/actions/workflows/\${{ github.workflow }}/runs" \\
  --jq "[.workflow_runs[] | select(.status == \\"completed\\" and .conclusion == \\"success\\")] | .[0:5] | .[].created_at" 2>/dev/null || echo "")

if [ -n "\${RECENT_RUNS}" ]; then
  CURRENT_TIME=$(date +%s)

  for run_time in \${RECENT_RUNS}; do
    RUN_TIMESTAMP=$(date -d "\${run_time}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "\${run_time}" +%s 2>/dev/null || echo "0")
    TIME_DIFF=$(( (CURRENT_TIME - RUN_TIMESTAMP) / 60 ))

    if [ "\${TIME_DIFF}" -lt "\${RATE_LIMIT_MINUTES}" ]; then
      echo "::warning::Rate limit: Agent ran \${TIME_DIFF} minutes ago. Minimum interval is \${RATE_LIMIT_MINUTES} minutes."
      echo "should-run=false" >> $GITHUB_OUTPUT
      exit 0
    fi
  done
fi
echo "✓ Rate limit check passed"

echo ""
echo "=== All validation checks passed ==="
echo "should-run=true" >> $GITHUB_OUTPUT`;
  }

  private generateClaudeStep(agent: AgentDefinition): string {
    // Build the prompt that will be passed to Claude Code
    const instructions = agent.markdown.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    return `# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Build context from GitHub event
CONTEXT="GitHub Event: \${{ github.event_name }}
Repository: \${{ github.repository }}
"

# Add issue context if available
if [ -n "\${{ github.event.issue.number }}" ]; then
  CONTEXT="\${CONTEXT}
Issue #\${{ github.event.issue.number }}: \${{ github.event.issue.title }}
Author: @\${{ github.event.issue.user.login }}
Body:
\${{ github.event.issue.body }}
"
fi

# Add PR context if available
if [ -n "\${{ github.event.pull_request.number }}" ]; then
  CONTEXT="\${CONTEXT}
PR #\${{ github.event.pull_request.number }}: \${{ github.event.pull_request.title }}
Author: @\${{ github.event.pull_request.user.login }}
Body:
\${{ github.event.pull_request.body }}
"
fi

# Run Claude Code with the agent instructions
claude -p "\${CONTEXT}

---

${instructions}" --allowedTools "Bash(git*),Bash(gh*),Read,Glob,Grep"`;
  }

  private generateEnvironment(_agent: AgentDefinition): Record<string, string> {
    return {
      ANTHROPIC_API_KEY: '${{ secrets.ANTHROPIC_API_KEY }}',
      CLAUDE_ACCESS_TOKEN: '${{ secrets.CLAUDE_ACCESS_TOKEN }}',
      GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
    };
  }

  async writeWorkflow(agent: AgentDefinition, outputDir: string): Promise<string> {
    const workflowName = agentNameToWorkflowName(agent.name);
    const fileName = `${workflowName}.yml`;
    const filePath = `${outputDir}/${fileName}`;

    const content = this.generate(agent);
    await writeFile(filePath, content, 'utf-8');

    return filePath;
  }
}

export const workflowGenerator = new WorkflowGenerator();
