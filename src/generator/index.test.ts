import { WorkflowGenerator } from './index';
import { AgentDefinition } from '../types';
import yaml from 'js-yaml';
import { mkdtempSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('WorkflowGenerator', () => {
  let generator: WorkflowGenerator;

  beforeEach(() => {
    generator = new WorkflowGenerator();
  });

  describe('generate', () => {
    it('should generate basic workflow with validate and claude-agent jobs', () => {
      const agent: AgentDefinition = {
        name: 'Test Agent',
        on: {
          issues: { types: ['opened'] },
        },
        markdown: 'Test instructions',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;

      expect(workflow.name).toBe('Test Agent');
      expect(workflow.on.issues.types).toContain('opened');
      expect(workflow.jobs['validate']).toBeDefined();
      expect(workflow.jobs['claude-agent']).toBeDefined();
    });

    it('should include permissions when specified', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        permissions: { issues: 'write', contents: 'read' },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;

      expect(workflow.permissions.issues).toBe('write');
      expect(workflow.permissions.contents).toBe('read');
    });

    it('should not include permissions when not specified', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;

      expect(workflow.permissions).toBeUndefined();
    });

    it('should configure checkout and node setup steps in claude-agent job', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const steps = workflow.jobs['claude-agent'].steps;

      expect(steps[0].uses).toBe('actions/checkout@v4');
      expect(steps[1].uses).toBe('actions/setup-node@v4');
      expect(steps[1].with['node-version']).toBe('20');
    });

    it('should include agent instructions in the run script', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: '# Test Instructions\n\nDo something.',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const runStep = workflow.jobs['claude-agent'].steps[2].run;

      expect(runStep).toContain('Test Instructions');
      expect(runStep).toContain('Do something');
    });

    it('should include Claude Code CLI installation', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const runStep = workflow.jobs['claude-agent'].steps[2].run;

      expect(runStep).toContain('npm install -g @anthropic-ai/claude-code');
      expect(runStep).toContain('claude -p');
    });

    it('should handle multiple trigger types', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: {
          issues: { types: ['opened'] },
          pull_request: { types: ['opened', 'synchronize'] },
          schedule: [{ cron: '0 9 * * *' }],
        },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;

      expect(workflow.on.issues).toBeDefined();
      expect(workflow.on.pull_request).toBeDefined();
      expect(workflow.on.schedule).toBeDefined();
      expect(workflow.on.schedule[0].cron).toBe('0 9 * * *');
    });

    it('should include GitHub secrets in environment', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const env = workflow.jobs['claude-agent'].steps[2].env;

      expect(env.ANTHROPIC_API_KEY).toContain('secrets.ANTHROPIC_API_KEY');
      expect(env.GITHUB_TOKEN).toContain('secrets.GITHUB_TOKEN');
    });

    it('should include issue context variables in run script', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const runStep = workflow.jobs['claude-agent'].steps[2].run;

      expect(runStep).toContain('github.event.issue.number');
      expect(runStep).toContain('github.event.issue.title');
    });

    it('should include PR context variables in run script', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { pull_request: { types: ['opened'] } },
        markdown: 'Test',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const runStep = workflow.jobs['claude-agent'].steps[2].run;

      expect(runStep).toContain('github.event.pull_request.number');
      expect(runStep).toContain('github.event.pull_request.title');
    });

    it('should escape special characters in markdown', () => {
      const agent: AgentDefinition = {
        name: 'Test',
        on: { issues: { types: ['opened'] } },
        markdown: 'Use `code` and $variable',
      };

      const result = generator.generate(agent);
      const workflow = yaml.load(result) as any;
      const runStep = workflow.jobs['claude-agent'].steps[2].run;

      expect(runStep).toContain('\\`code\\`');
      expect(runStep).toContain('\\$variable');
    });

    describe('validation job', () => {
      it('should have validation job that runs before claude-agent', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;

        expect(workflow.jobs['validate']).toBeDefined();
        expect(workflow.jobs['claude-agent'].needs).toBe('validate');
        expect(workflow.jobs['claude-agent'].if).toContain('should-run');
      });

      it('should include secret validation in validate job', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('ANTHROPIC_API_KEY');
        expect(validateStep).toContain('CLAUDE_ACCESS_TOKEN');
        expect(validateStep).toContain('No Claude authentication found');
      });

      it('should include user authorization check in validate job', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('User authorization');
        expect(validateStep).toContain('github.actor');
        expect(validateStep).toContain('collaborators');
      });

      it('should include rate limiting check in validate job', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('Rate limit');
        expect(validateStep).toContain('RATE_LIMIT_MINUTES');
      });

      it('should use custom rate limit when specified', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          rateLimitMinutes: 10,
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('RATE_LIMIT_MINUTES=10');
      });

      it('should include allowed users when specified', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          allowedUsers: ['user1', 'user2'],
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('user1 user2');
      });

      it('should include trigger labels when specified', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          triggerLabels: ['claude', 'ai-help'],
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;
        const validateStep = workflow.jobs['validate'].steps[0].run;

        expect(validateStep).toContain('claude ai-help');
        expect(validateStep).toContain('Required label');
      });

      it('should output should-run from validation job', () => {
        const agent: AgentDefinition = {
          name: 'Test',
          on: { issues: { types: ['opened'] } },
          markdown: 'Test',
        };

        const result = generator.generate(agent);
        const workflow = yaml.load(result) as any;

        expect(workflow.jobs['validate'].outputs['should-run']).toContain('steps.validation.outputs.should-run');
      });
    });
  });

  describe('writeWorkflow', () => {
    it('should write workflow to file', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      const agent: AgentDefinition = {
        name: 'Test Agent',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const outputPath = await generator.writeWorkflow(agent, tempDir);

      expect(outputPath).toContain('claude-test-agent.yml');
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('name: Test Agent');
    });

    it('should use kebab-case for filename', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      const agent: AgentDefinition = {
        name: 'My Complex Agent Name',
        on: { issues: { types: ['opened'] } },
        markdown: 'Test',
      };

      const outputPath = await generator.writeWorkflow(agent, tempDir);

      expect(outputPath).toContain('claude-my-complex-agent-name.yml');
    });
  });
});
