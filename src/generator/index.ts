import { writeFile } from 'fs/promises';
import { join } from 'path';
import { dump as yamlDump } from 'js-yaml';
import type {
  AgentDefinition,
  WorkflowStep,
  TriggerConfig,
  PermissionsConfig,
  OutputConfig,
  Output,
  InputConfig,
} from '../types';
import { getOutputHandler } from './outputs';
import type { RuntimeContext } from './outputs/base';
import { InputCollector } from './input-collector';
import { SkillsGenerator } from './skills';
import { logger } from '../cli/utils/logger';

export class WorkflowGenerator {
  generate(agent: AgentDefinition): string {
    const workflow: any = {
      name: agent.name,
      on: this.convertTriggers(agent.on),
    };

    // Set permissions at workflow level
    if (agent.permissions) {
      workflow.permissions = this.convertPermissions(agent.permissions);
    }

    // Use default permissions if none specified
    if (!workflow.permissions) {
      workflow.permissions = {
        contents: 'read',
      };
    }

    // Jobs
    workflow.jobs = {
      'pre-flight': this.generatePreFlightJob(agent),
    };

    // Add collect-inputs job if inputs are configured
    if (agent.inputs) {
      workflow.jobs['collect-inputs'] = this.generateCollectInputsJob(agent);
    }

    workflow.jobs['claude-agent'] = this.generateClaudeAgentJob(agent);

    // Only add execute-outputs job if there are outputs
    if (agent.outputs && Object.keys(agent.outputs).length > 0) {
      workflow.jobs['execute-outputs'] = this.generateExecuteOutputsJob(agent);
      workflow.jobs['report-results'] = this.generateReportResultsJob(agent);
    }

    // Always add audit-report job
    workflow.jobs['audit-report'] = this.generateAuditReportJob(agent);

    return yamlDump(workflow, {
      lineWidth: -1, // Disable line wrapping
      quotingType: '"',
      forceQuotes: false,
    });
  }

  async writeWorkflow(agent: AgentDefinition, outputDir: string): Promise<string> {
    const workflow = this.generate(agent);
    const fileName = this.agentNameToFileName(agent.name);
    const outputPath = join(outputDir, fileName);

    await writeFile(outputPath, workflow, 'utf-8');

    return outputPath;
  }

  private agentNameToFileName(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '.yml'
    );
  }

  private convertTriggers(triggers: TriggerConfig): any {
    const converted: any = {};

    if (triggers.issues) {
      converted.issues = triggers.issues;
    }

    if (triggers.pull_request) {
      converted.pull_request = triggers.pull_request;
    }

    if (triggers.discussion) {
      converted.discussion = triggers.discussion;
    }

    if (triggers.schedule) {
      converted.schedule = triggers.schedule;
    }

    if (triggers.workflow_dispatch) {
      converted.workflow_dispatch = triggers.workflow_dispatch;
    }

    if (triggers.repository_dispatch) {
      converted.repository_dispatch = triggers.repository_dispatch;
    }

    return converted;
  }

  private convertPermissions(permissions: PermissionsConfig): any {
    const converted: any = {};

    if (permissions.contents) {
      converted.contents = permissions.contents;
    }

    if (permissions.issues) {
      converted.issues = permissions.issues;
    }

    if (permissions.pull_requests) {
      converted['pull-requests'] = permissions.pull_requests;
    }

    if (permissions.discussions) {
      converted.discussions = permissions.discussions;
    }

    return converted;
  }

  /**
   * Generates GitHub App token generation step
   */
  private generateTokenGenerationStep(): WorkflowStep {
    return {
      name: 'Generate GitHub App Token',
      id: 'generate-token',
      uses: 'actions/create-github-app-token@v1',
      if: "env.GH_APP_ID != '' && env.GH_APP_PRIVATE_KEY != ''",
      with: {
        'app-id': '${{ secrets.GH_APP_ID }}',
        'private-key': '${{ secrets.GH_APP_PRIVATE_KEY }}',
      },
      env: {
        GH_APP_ID: '${{ secrets.GH_APP_ID }}',
        GH_APP_PRIVATE_KEY: '${{ secrets.GH_APP_PRIVATE_KEY }}',
      },
    };
  }

  /**
   * Generates the pre-flight validation job
   */
  private generatePreFlightJob(agent: AgentDefinition): any {
    const steps: WorkflowStep[] = [];

    // Add GitHub App token generation
    steps.push(this.generateTokenGenerationStep());

    // Validation steps
    steps.push(...this.generateValidationSteps(agent));

    return {
      'runs-on': 'ubuntu-latest',
      outputs: {
        'should-run': '${{ steps.validation.outputs.should-run }}',
        'validation-status': '${{ steps.validation.outputs.status }}',
        'validation-errors': '${{ steps.validation.outputs.errors }}',
      },
      steps,
    };
  }

  /**
   * Generates validation steps for pre-flight job
   */
  private generateValidationSteps(agent: AgentDefinition): WorkflowStep[] {
    const allowedUsers = agent.allowed_users || agent.allowed_actors || [];
    const allowedTeams = agent.allowed_teams || [];
    const triggerLabels = agent.trigger_labels || [];
    const rateLimitMinutes = agent.rate_limit_minutes || 5;

    const allowedUsersArray = allowedUsers.length > 0 ? JSON.stringify(allowedUsers) : '[]';
    const allowedTeamsArray = allowedTeams.length > 0 ? JSON.stringify(allowedTeams) : '[]';
    const triggerLabelsArray = triggerLabels.length > 0 ? JSON.stringify(triggerLabels) : '[]';

    return [
      {
        name: 'Run validation checks',
        id: 'validation',
        env: {
          GITHUB_TOKEN:
            '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
        },
        run: `#!/bin/bash
set -e

# Initialize validation status
VALIDATION_ERRORS=""
VALIDATION_STATUS="success"

# Check 1: Verify Claude API authentication is available
if [ -z "\${{ secrets.ANTHROPIC_API_KEY }}" ] && [ -z "\${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}" ]; then
  echo "❌ Neither ANTHROPIC_API_KEY nor CLAUDE_CODE_OAUTH_TOKEN secret is set"
  VALIDATION_ERRORS="\${VALIDATION_ERRORS}Missing API credentials. "
  VALIDATION_STATUS="failed"
else
  echo "✅ Claude API credentials found"
fi

# Check 2: Verify user authorization (admin, write access, org member, or in allowed list)
TRIGGERED_BY="\${{ github.actor }}"
REPO_OWNER="\${{ github.repository_owner }}"

# Get user's permission level
PERMISSION=$(gh api repos/\${{ github.repository }}/collaborators/\${TRIGGERED_BY}/permission --jq .permission 2>/dev/null || echo "none")

echo "User \${TRIGGERED_BY} has permission level: \${PERMISSION}"

# Check if user has admin or write access
if [ "\${PERMISSION}" = "admin" ] || [ "\${PERMISSION}" = "write" ]; then
  echo "✅ User has sufficient repository permissions (\${PERMISSION})"
  AUTHORIZED=true
else
  # Check if user is org member
  IS_ORG_MEMBER=$(gh api orgs/\${REPO_OWNER}/members/\${TRIGGERED_BY} 2>/dev/null && echo "true" || echo "false")
  
  if [ "\${IS_ORG_MEMBER}" = "true" ]; then
    echo "✅ User is organization member"
    AUTHORIZED=true
  else
    # Check allowed users/teams lists
    ALLOWED_USERS='${allowedUsersArray}'
    ALLOWED_TEAMS='${allowedTeamsArray}'
    
    # Check if user is in allowed users list
    if echo "\${ALLOWED_USERS}" | jq -e --arg user "\${TRIGGERED_BY}" 'index(\$user)' > /dev/null; then
      echo "✅ User is in allowed users list"
      AUTHORIZED=true
    # Check if user is in any allowed teams
    elif [ "\${ALLOWED_TEAMS}" != "[]" ]; then
      USER_TEAMS=$(gh api user/teams --paginate --jq '.[].slug' 2>/dev/null || echo "")
      AUTHORIZED=false
      
      for team in $(echo "\${ALLOWED_TEAMS}" | jq -r '.[]'); do
        if echo "\${USER_TEAMS}" | grep -q "^\${team}\$"; then
          echo "✅ User is in allowed team: \${team}"
          AUTHORIZED=true
          break
        fi
      done
      
      if [ "\${AUTHORIZED}" != "true" ]; then
        echo "❌ User is not in any allowed teams"
        VALIDATION_ERRORS="\${VALIDATION_ERRORS}User not authorized. "
        VALIDATION_STATUS="failed"
      fi
    else
      echo "❌ User is not authorized (no repository access, not org member, not in allowed list)"
      VALIDATION_ERRORS="\${VALIDATION_ERRORS}User not authorized. "
      VALIDATION_STATUS="failed"
    fi
  fi
fi

# Check 3: Verify required labels (if configured)
TRIGGER_LABELS='${triggerLabelsArray}'
if [ "\${TRIGGER_LABELS}" != "[]" ]; then
  # Only check labels for issue/PR events
  if [ "\${{ github.event_name }}" = "issues" ] || [ "\${{ github.event_name }}" = "pull_request" ]; then
    ISSUE_NUMBER="\${{ github.event.issue.number || github.event.pull_request.number }}"
    ISSUE_LABELS=$(gh api repos/\${{ github.repository }}/issues/\${ISSUE_NUMBER} --jq '.labels[].name' | jq -R . | jq -s .)
    
    LABELS_MATCH=false
    for label in $(echo "\${TRIGGER_LABELS}" | jq -r '.[]'); do
      if echo "\${ISSUE_LABELS}" | jq -e --arg label "\${label}" 'index(\$label)' > /dev/null; then
        LABELS_MATCH=true
        break
      fi
    done
    
    if [ "\${LABELS_MATCH}" = "true" ]; then
      echo "✅ Required trigger label found"
    else
      echo "❌ None of the required trigger labels found: $(echo "\${TRIGGER_LABELS}" | jq -r 'join(", ")')"
      VALIDATION_ERRORS="\${VALIDATION_ERRORS}Missing required label. "
      VALIDATION_STATUS="failed"
    fi
  fi
fi

# Check 4: Rate limiting
RATE_LIMIT_MINUTES=${rateLimitMinutes}
LAST_RUN=$(gh api repos/\${{ github.repository }}/actions/workflows/$(basename \${{ github.workflow_ref }}) --jq '.path' 2>/dev/null | xargs -I {} gh api repos/\${{ github.repository }}/actions/workflows/{}/runs --jq '.workflow_runs[0].created_at' 2>/dev/null || echo "")

if [ -n "\${LAST_RUN}" ]; then
  LAST_RUN_EPOCH=$(date -d "\${LAST_RUN}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "\${LAST_RUN}" +%s 2>/dev/null || echo "0")
  NOW_EPOCH=$(date +%s)
  MINUTES_SINCE_LAST_RUN=$(( (NOW_EPOCH - LAST_RUN_EPOCH) / 60 ))
  
  if [ "\${MINUTES_SINCE_LAST_RUN}" -lt "\${RATE_LIMIT_MINUTES}" ]; then
    echo "❌ Rate limit: Last run was \${MINUTES_SINCE_LAST_RUN} minutes ago (minimum: \${RATE_LIMIT_MINUTES} minutes)"
    VALIDATION_ERRORS="\${VALIDATION_ERRORS}Rate limit exceeded. "
    VALIDATION_STATUS="failed"
  else
    echo "✅ Rate limit check passed (last run: \${MINUTES_SINCE_LAST_RUN} minutes ago)"
  fi
else
  echo "✅ Rate limit check passed (first run)"
fi

# Set outputs
if [ "\${VALIDATION_STATUS}" = "success" ]; then
  echo "should-run=true" >> \$GITHUB_OUTPUT
else
  echo "should-run=false" >> \$GITHUB_OUTPUT
fi

echo "status=\${VALIDATION_STATUS}" >> \$GITHUB_OUTPUT
echo "errors=\${VALIDATION_ERRORS}" >> \$GITHUB_OUTPUT

echo ""
echo "=== Validation Summary ==="
echo "Status: \${VALIDATION_STATUS}"
if [ -n "\${VALIDATION_ERRORS}" ]; then
  echo "Errors: \${VALIDATION_ERRORS}"
fi
`,
      },
    ];
  }

  /**
   * Generates the input collection job
   */
  private generateCollectInputsJob(agent: AgentDefinition): any {
    if (!agent.inputs) {
      throw new Error('Cannot generate collect-inputs job without inputs configuration');
    }

    const collector = new InputCollector(agent.inputs, '${{ github.repository }}');

    return {
      'runs-on': 'ubuntu-latest',
      needs: ['pre-flight'],
      if: "needs.pre-flight.outputs.should-run == 'true'",
      outputs: {
        'has-inputs': '${{ steps.collect.outputs.has-inputs }}',
        'inputs-data': '${{ steps.collect.outputs.inputs-data }}',
      },
      steps: [
        this.generateTokenGenerationStep(),
        {
          name: 'Collect repository data',
          id: 'collect',
          env: {
            GITHUB_TOKEN:
              '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
          },
          run: collector.generateCollectionScript(),
        },
      ],
    };
  }

  /**
   * Generates the main Claude agent execution job
   */
  private generateClaudeAgentJob(agent: AgentDefinition): any {
    const needs = ['pre-flight'];
    let ifCondition = "needs.pre-flight.outputs.should-run == 'true'";

    // Add collect-inputs dependency if inputs are configured
    if (agent.inputs) {
      needs.push('collect-inputs');
      ifCondition += " && needs.collect-inputs.outputs.has-inputs == 'true'";
    }

    return {
      'runs-on': 'ubuntu-latest',
      needs,
      if: ifCondition,
      steps: this.generateClaudeAgentSteps(agent),
    };
  }

  /**
   * Generates steps for Claude agent execution
   */
  private generateClaudeAgentSteps(agent: AgentDefinition): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    // Add GitHub App token generation
    steps.push(this.generateTokenGenerationStep());

    // Checkout repository
    steps.push({
      name: 'Checkout repository',
      uses: 'actions/checkout@v4',
      with: {
        token:
          '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
      },
    });

    // Setup Bun
    steps.push({
      name: 'Setup Bun',
      uses: 'oven-sh/setup-bun@v2',
    });

    // Prepare context file
    steps.push({
      name: 'Prepare context file',
      env: {
        GITHUB_TOKEN:
          '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
      },
      run: this.generateContextPreparationScript(agent),
    });

    // Create skills file for Claude
    steps.push({
      name: 'Create skills documentation',
      run: this.generateSkillsDocumentation(agent),
    });

    // Run Claude
    steps.push({
      name: 'Run Claude agent',
      id: 'claude',
      run: this.generateClaudeExecutionScript(agent),
    });

    // Extract and log metrics
    steps.push({
      name: 'Extract execution metrics',
      if: 'always()',
      run: `#!/bin/bash
set +e  # Don't exit on error

if [ -f /tmp/claude-output.txt ]; then
  echo "=== Claude Execution Metrics ==="
  
  # Extract metrics using regex patterns
  TOTAL_COST=$(grep -oP 'Total cost: \\$\\K[0-9.]+' /tmp/claude-output.txt || echo "0")
  IS_ERROR=$(grep -q "is_error=true" /tmp/claude-output.txt && echo "true" || echo "false")
  DURATION=$(grep -oP 'duration=\\K[0-9]+' /tmp/claude-output.txt || echo "0")
  API_DURATION=$(grep -oP 'duration_api=\\K[0-9]+' /tmp/claude-output.txt || echo "0")
  NUM_TURNS=$(grep -oP 'num_turns=\\K[0-9]+' /tmp/claude-output.txt || echo "0")
  SESSION_ID=$(grep -oP 'session_id=\\K[a-zA-Z0-9-]+' /tmp/claude-output.txt || echo "unknown")
  
  echo "Total Cost: \\$\${TOTAL_COST}"
  echo "Error: \${IS_ERROR}"
  echo "Duration: \${DURATION}ms"
  echo "API Duration: \${API_DURATION}ms"
  echo "Number of Turns: \${NUM_TURNS}"
  echo "Session ID: \${SESSION_ID}"
  
  # Save metrics for audit
  mkdir -p /tmp/audit
  cat > /tmp/audit/metrics.json << EOF
{
  "total_cost_usd": \${TOTAL_COST},
  "is_error": \${IS_ERROR},
  "duration_ms": \${DURATION},
  "duration_api_ms": \${API_DURATION},
  "num_turns": \${NUM_TURNS},
  "session_id": "\${SESSION_ID}"
}
EOF
else
  echo "No Claude output file found"
fi
`,
    });

    // Upload outputs artifact
    if (agent.outputs && Object.keys(agent.outputs).length > 0) {
      steps.push({
        name: 'Upload outputs',
        if: 'always()',
        uses: 'actions/upload-artifact@v4',
        with: {
          name: 'claude-outputs',
          path: '/tmp/outputs/',
          'if-no-files-found': 'ignore',
        },
      });

      steps.push({
        name: 'Upload audit data',
        if: 'always()',
        uses: 'actions/upload-artifact@v4',
        with: {
          name: 'audit-data',
          path: '/tmp/audit/',
          'if-no-files-found': 'ignore',
        },
      });
    }

    return steps;
  }

  /**
   * Generates script to prepare context file for Claude
   */
  private generateContextPreparationScript(agent: AgentDefinition): string {
    let script = `#!/bin/bash
set -e

mkdir -p /tmp/outputs
mkdir -p /tmp/audit

# Start context file
cat > /tmp/context.txt << 'CONTEXT_EOF'
GitHub Event: \${{ github.event_name }}
Repository: \${{ github.repository }}
`;

    // Add event-specific context
    script += `
if [ "\${{ github.event_name }}" = "issues" ]; then
  cat >> /tmp/context.txt << 'ISSUE_EOF'
Issue Number: \${{ github.event.issue.number }}
Issue Title: \${{ github.event.issue.title }}
Issue Author: \${{ github.event.issue.user.login }}
Issue Body:
\${{ github.event.issue.body }}
ISSUE_EOF
fi

if [ "\${{ github.event_name }}" = "pull_request" ]; then
  cat >> /tmp/context.txt << 'PR_EOF'
Pull Request Number: \${{ github.event.pull_request.number }}
PR Title: \${{ github.event.pull_request.title }}
PR Author: \${{ github.event.pull_request.user.login }}
PR Body:
\${{ github.event.pull_request.body }}
PR_EOF
fi

if [ "\${{ github.event_name }}" = "discussion" ]; then
  cat >> /tmp/context.txt << 'DISCUSSION_EOF'
Discussion Number: \${{ github.event.discussion.number }}
Discussion Title: \${{ github.event.discussion.title }}
Discussion Author: \${{ github.event.discussion.user.login }}
Discussion Body:
\${{ github.event.discussion.body }}
DISCUSSION_EOF
fi
`;

    // Add collected inputs if configured
    if (agent.inputs) {
      script += `
# Add collected inputs
if [ "\${{ needs.collect-inputs.outputs.has-inputs }}" = "true" ]; then
  cat >> /tmp/context.txt << 'INPUTS_EOF'

---

# Collected Repository Data

\${{ needs.collect-inputs.outputs.inputs-data }}
INPUTS_EOF
fi
`;
    }

    // Fetch dynamic context from output handlers
    if (agent.outputs) {
      const runtime: RuntimeContext = {
        repository: '${{ github.repository }}',
        issueNumber:
          '${{ github.event.issue.number || github.event.pull_request.number || "" }}',
        prNumber: '${{ github.event.pull_request.number || "" }}',
        allowedPaths: agent.allowed_paths,
      };

      for (const [outputType, config] of Object.entries(agent.outputs)) {
        try {
          const handler = getOutputHandler(outputType as Output);
          const outputConfig = typeof config === 'boolean' ? {} : (config as OutputConfig);
          const contextScript = handler.getContextScript(runtime);

          if (contextScript) {
            script += `\n${contextScript}\n`;
          }
        } catch (error) {
          // Handler not found - skip
          logger.warn(`Warning: No handler found for output type: ${outputType}`);
        }
      }
    }

    script += `\n# Close context file
cat >> /tmp/context.txt << 'CONTEXT_EOF'
CONTEXT_EOF
`;

    return script;
  }

  /**
   * Generates skills documentation for Claude
   */
  private generateSkillsDocumentation(agent: AgentDefinition): string {
    const skillsGen = new SkillsGenerator();
    const skillsContent = skillsGen.generateSkillsFile(agent);

    return `mkdir -p .claude

cat > .claude/CLAUDE.md << 'SKILLS_EOF'
${skillsContent}
SKILLS_EOF
`;
  }

  /**
   * Generates Claude execution script
   */
  private generateClaudeExecutionScript(agent: AgentDefinition): string {
    const model = agent.claude?.model || 'claude-3-5-sonnet-20241022';
    const maxTokens = agent.claude?.max_tokens || 4096;
    const temperature = agent.claude?.temperature ?? 0.7;

    // Determine authentication method
    const authEnv = `\${ANTHROPIC_API_KEY:-\${CLAUDE_CODE_OAUTH_TOKEN}}`;

    // Build tool permissions flags
    let toolFlags = '';

    if (agent.outputs) {
      // Agent has specific outputs configured - use safe mode with Write permission
      toolFlags = '--safe-mode --allow-tools Write';
    } else {
      // No outputs - use safe mode only (read-only)
      toolFlags = '--safe-mode';
    }

    return `#!/bin/bash
set -e

# Install Claude Code CLI
bunx claude-code --version || bunx claude-code@latest --version

# Set authentication
export ANTHROPIC_API_KEY="\${{ secrets.ANTHROPIC_API_KEY }}"
export CLAUDE_CODE_OAUTH_TOKEN="\${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}"

# Prepare prompt
CONTEXT=$(cat /tmp/context.txt)
INSTRUCTIONS=$(cat << 'INSTRUCTIONS_EOF'
${agent.markdown}
INSTRUCTIONS_EOF
)

PROMPT="\${CONTEXT}\n\n---\n\n\${INSTRUCTIONS}"

# Run Claude with safe mode and specific tool permissions
echo "\${PROMPT}" | bunx claude-code \${PROMPT} \\
  --model ${model} \\
  --max-tokens ${maxTokens} \\
  --temperature ${temperature} \\
  ${toolFlags} \\
  2>&1 | tee /tmp/claude-output.txt

echo "Claude agent execution completed"
`;
  }

  /**
   * Generates the output execution job
   */
  private generateExecuteOutputsJob(agent: AgentDefinition): any {
    if (!agent.outputs || Object.keys(agent.outputs).length === 0) {
      throw new Error('Cannot generate execute-outputs job without outputs configuration');
    }

    const outputTypes = Object.keys(agent.outputs);

    return {
      'runs-on': 'ubuntu-latest',
      needs: ['claude-agent'],
      if: 'always()',
      strategy: {
        matrix: {
          'output-type': outputTypes,
        },
        'fail-fast': false,
      },
      steps: [
        this.generateTokenGenerationStep(),
        {
          name: 'Download outputs artifact',
          uses: 'actions/download-artifact@v4',
          with: {
            name: 'claude-outputs',
            path: '/tmp/outputs/',
          },
          continue: { 'on-error': true },
        },
        {
          name: 'Execute output: ${{ matrix.output-type }}',
          env: {
            GITHUB_TOKEN:
              '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
          },
          run: this.generateOutputExecutionScript(agent),
        },
        {
          name: 'Upload validation errors',
          if: 'always()',
          uses: 'actions/upload-artifact@v4',
          with: {
            name: 'validation-errors-${{ matrix.output-type }}',
            path: '/tmp/validation-errors/',
            'if-no-files-found': 'ignore',
          },
        },
      ],
    };
  }

  /**
   * Generates script to execute a specific output type
   */
  private generateOutputExecutionScript(agent: AgentDefinition): string {
    const runtime: RuntimeContext = {
      repository: '${{ github.repository }}',
      issueNumber: '${{ github.event.issue.number || github.event.pull_request.number || "" }}',
      prNumber: '${{ github.event.pull_request.number || "" }}',
      allowedPaths: agent.allowed_paths,
    };

    let script = `#!/bin/bash
set +e  # Don't exit on error to allow error collection

mkdir -p /tmp/validation-errors

OUTPUT_TYPE="\${{ matrix.output-type }}"

echo "Executing output: \${OUTPUT_TYPE}"

`;

    // Generate validation script for each output type
    if (agent.outputs) {
      for (const [outputType, config] of Object.entries(agent.outputs)) {
        try {
          const handler = getOutputHandler(outputType as Output);
          const outputConfig = typeof config === 'boolean' ? {} : (config as OutputConfig);
          const validationScript = handler.generateValidationScript(outputConfig, runtime);

          script += `if [ "\${OUTPUT_TYPE}" = "${outputType}" ]; then
${validationScript}
fi

`;
        } catch (error) {
          // Handler not found - skip
          logger.warn(`Warning: No handler found for output type: ${outputType}`);
        }
      }
    }

    script += `echo "Output execution completed for \${OUTPUT_TYPE}"
`;

    return script;
  }

  /**
   * Generates the validation error reporting job
   */
  private generateReportResultsJob(_agent: AgentDefinition): any {
    return {
      'runs-on': 'ubuntu-latest',
      needs: ['execute-outputs'],
      if: 'always() && needs.execute-outputs.result != \'success\'',
      steps: [
        this.generateTokenGenerationStep(),
        {
          name: 'Download all validation errors',
          uses: 'actions/download-artifact@v4',
          with: {
            pattern: 'validation-errors-*',
            path: '/tmp/validation-errors/',
            'merge-multiple': true,
          },
          continue: { 'on-error': true },
        },
        {
          name: 'Report validation errors',
          if: "github.event_name == 'issues' || github.event_name == 'pull_request'",
          env: {
            GITHUB_TOKEN:
              '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
          },
          run: `#!/bin/bash
set -e

ISSUE_NUMBER="\${{ github.event.issue.number || github.event.pull_request.number }}"

if [ -z "\${ISSUE_NUMBER}" ]; then
  echo "No issue or PR number available - skipping error reporting"
  exit 0
fi

# Collect all validation errors
if [ -d /tmp/validation-errors ] && [ -n "$(ls -A /tmp/validation-errors 2>/dev/null)" ]; then
  ERROR_MESSAGE="## ⚠️ Agent Output Validation Errors\n\nThe following validation errors occurred:\n\n"
  
  for error_file in /tmp/validation-errors/*.txt; do
    if [ -f "\${error_file}" ]; then
      ERROR_MESSAGE="\${ERROR_MESSAGE}$(cat \${error_file})\n"
    fi
  done
  
  ERROR_MESSAGE="\${ERROR_MESSAGE}\n---\n\nWorkflow run: [\${{ github.run_id }}](\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }})"
  
  # Post comment to issue/PR
  gh api "repos/\${{ github.repository }}/issues/\${ISSUE_NUMBER}/comments" \\
    -f body="\${ERROR_MESSAGE}"
  
  echo "Posted validation errors to issue/PR #\${ISSUE_NUMBER}"
else
  echo "No validation errors found"
fi
`,
        },
      ],
    };
  }

  /**
   * Generates the audit report job
   */
  private generateAuditReportJob(agent: AgentDefinition): any {
    const createIssues = agent.audit?.create_issues ?? true;
    const auditLabels = agent.audit?.labels || ['automated', 'agent-failure'];
    const auditAssignees = agent.audit?.assignees || [];

    return {
      'runs-on': 'ubuntu-latest',
      needs: ['pre-flight', 'claude-agent'],
      if: 'always()',
      steps: [
        this.generateTokenGenerationStep(),
        {
          name: 'Download audit data',
          uses: 'actions/download-artifact@v4',
          with: {
            name: 'audit-data',
            path: '/tmp/audit/',
          },
          continue: { 'on-error': true },
        },
        {
          name: 'Download validation errors',
          uses: 'actions/download-artifact@v4',
          with: {
            pattern: 'validation-errors-*',
            path: '/tmp/validation-errors/',
            'merge-multiple': true,
          },
          continue: { 'on-error': true },
        },
        {
          name: 'Generate audit report',
          id: 'audit',
          env: {
            GITHUB_TOKEN:
              '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
          },
          run: this.generateAuditReportScript(agent),
        },
        {
          name: 'Create failure issue',
          if: `steps.audit.outputs.status == 'failed' && ${createIssues ? 'true' : 'false'}`,
          env: {
            GITHUB_TOKEN:
              '${{ steps.generate-token.outputs.token || secrets.GITHUB_TOKEN || github.token }}',
          },
          run: this.generateFailureIssueScript(auditLabels, auditAssignees),
        },
      ],
    };
  }

  /**
   * Generates audit report script
   */
  private generateAuditReportScript(_agent: AgentDefinition): string {
    return `#!/bin/bash
set +e  # Don't exit on error

echo "=== Agent Execution Audit Report ==="
echo "Agent: ${{ github.workflow }}"
echo "Run ID: ${{ github.run_id }}"
echo "Triggered by: ${{ github.actor }}"
echo "Event: ${{ github.event_name }}"
echo "Started: ${{ github.event.created_at }}"
echo ""

# Load metrics
if [ -f /tmp/audit/metrics.json ]; then
  echo "=== Execution Metrics ==="
  cat /tmp/audit/metrics.json | jq .
  
  IS_ERROR=$(cat /tmp/audit/metrics.json | jq -r '.is_error')
  TOTAL_COST=$(cat /tmp/audit/metrics.json | jq -r '.total_cost_usd')
  
  echo ""
  echo "Total Cost: \\$\${TOTAL_COST}"
  echo "Error Status: \${IS_ERROR}"
else
  echo "No metrics data available"
  IS_ERROR="true"
fi

echo ""
echo "=== Validation Status ==="
echo "Secrets Check: ${{ needs.pre-flight.outputs.validation-status }}"
echo "Pre-flight: ${{ needs.pre-flight.result }}"
echo "Claude Agent: ${{ needs.claude-agent.result }}"

# Check for validation errors
VALIDATION_ERRORS=""
if [ -d /tmp/validation-errors ] && [ -n "$(ls -A /tmp/validation-errors 2>/dev/null)" ]; then
  echo ""
  echo "=== Validation Errors ==="
  for error_file in /tmp/validation-errors/*.txt; do
    if [ -f "\${error_file}" ]; then
      cat "\${error_file}"
      VALIDATION_ERRORS="\${VALIDATION_ERRORS}$(cat \${error_file})\n"
    fi
  done
fi

# Determine overall status
if [ "${{ needs.pre-flight.result }}" != "success" ] || [ "${{ needs.claude-agent.result }}" != "success" ]; then
  AUDIT_STATUS="failed"
else
  AUDIT_STATUS="success"
fi

echo ""
echo "Overall Status: \${AUDIT_STATUS}"

# Set outputs
echo "status=\${AUDIT_STATUS}" >> \$GITHUB_OUTPUT

# Save audit report
mkdir -p /tmp/audit
cat > /tmp/audit/report.txt << EOF
Agent Execution Audit Report
============================

Agent: ${{ github.workflow }}
Run ID: ${{ github.run_id }}
Run URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
Triggered by: ${{ github.actor }}
Event: ${{ github.event_name }}
Started: ${{ github.event.created_at }}

Validation Status: ${{ needs.pre-flight.outputs.validation-status }}
Pre-flight Result: ${{ needs.pre-flight.result }}
Claude Agent Result: ${{ needs.claude-agent.result }}

Overall Status: \${AUDIT_STATUS}

Validation Errors:
\${VALIDATION_ERRORS}
EOF

cat /tmp/audit/report.txt
`;
  }

  /**
   * Generates script to create failure issue
   */
  private generateFailureIssueScript(labels: string[], assignees: string[]): string {
    const labelsJson = JSON.stringify(labels);
    const assigneesJson = JSON.stringify(assignees);

    return `#!/bin/bash
set -e

echo "Creating failure issue..."

# Read audit report
if [ -f /tmp/audit/report.txt ]; then
  AUDIT_REPORT=$(cat /tmp/audit/report.txt)
else
  AUDIT_REPORT="No audit report available"
fi

# Create issue body
ISSUE_BODY="## 🤖 Agent Execution Failed\n\n"
ISSUE_BODY="\${ISSUE_BODY}The Claude agent \"${{ github.workflow }}\" failed to execute successfully.\n\n"
ISSUE_BODY="\${ISSUE_BODY}### Audit Report\n\n"
ISSUE_BODY="\${ISSUE_BODY}\\\`\\\`\\\`\n"
ISSUE_BODY="\${ISSUE_BODY}\${AUDIT_REPORT}\n"
ISSUE_BODY="\${ISSUE_BODY}\\\`\\\`\\\`\n\n"
ISSUE_BODY="\${ISSUE_BODY}### Actions\n\n"
ISSUE_BODY="\${ISSUE_BODY}- Review the [workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})\n"
ISSUE_BODY="\${ISSUE_BODY}- Check the agent configuration in \\\`.github/claude-agents/\\\`\n"
ISSUE_BODY="\${ISSUE_BODY}- Verify API credentials are properly configured\n"

# Create the issue
ISSUE_DATA=$(cat << EOF
{
  "title": "Agent Failure: ${{ github.workflow }} (Run #${{ github.run_number }})",
  "body": "\${ISSUE_BODY}",
  "labels": ${labelsJson},
  "assignees": ${assigneesJson}
}
EOF
)

echo "\${ISSUE_DATA}" | gh api repos/${{ github.repository }}/issues --input - | jq -r '.html_url'

echo "Failure issue created successfully"
`;
  }
}

// Export singleton instance
export const workflowGenerator = new WorkflowGenerator();

