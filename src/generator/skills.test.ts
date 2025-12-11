import { generateSkillsSection, generateSkillForOutput } from './skills';
import type { Output } from '../types/index';

describe('generateSkillsSection', () => {
  it('should return empty string when no outputs configured', () => {
    const result = generateSkillsSection(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty outputs object', () => {
    const result = generateSkillsSection({});
    expect(result).toBe('');
  });

  it('should generate section with header for single output', () => {
    const outputs = { 'add-comment': true };
    const result = generateSkillsSection(outputs);

    expect(result).toContain('# Available Operations');
    expect(result).toContain('## Operation: Add Comment');
  });

  it('should generate section with multiple outputs', () => {
    const outputs = {
      'add-comment': { max: 1 },
      'add-label': true,
    };
    const result = generateSkillsSection(outputs);

    expect(result).toContain('## Operation: Add Comment');
    expect(result).toContain('## Operation: Add Labels');
  });

  it('should pass allowedPaths to update-file skill', () => {
    const outputs = { 'update-file': { sign: true } };
    const allowedPaths = ['src/**/*.ts', '*.md'];
    const result = generateSkillsSection(outputs, allowedPaths);

    expect(result).toContain('src/**/*.ts');
    expect(result).toContain('*.md');
    expect(result).toContain('Allowed paths');
  });
});

describe('generateSkillForOutput', () => {
  describe('add-comment', () => {
    it('should generate add-comment skill with unlimited max', () => {
      const result = generateSkillForOutput('add-comment', {}, []);

      expect(result).toContain('## Operation: Add Comment');
      expect(result).toContain('mcp__github__issues_addComment');
      expect(result).toContain('mcp__github__pulls_addComment');
      expect(result).toContain('Maximum comments: unlimited');
    });

    it('should include max constraint when specified', () => {
      const result = generateSkillForOutput('add-comment', { max: 1 }, []);

      expect(result).toContain('Maximum comments: 1');
    });
  });

  describe('add-label', () => {
    it('should generate add-label skill', () => {
      const result = generateSkillForOutput('add-label', {}, []);

      expect(result).toContain('## Operation: Add Labels');
      expect(result).toContain('mcp__github__issues_addLabels');
      expect(result).toContain('mcp__github__pulls_addLabels');
      expect(result).toContain('Labels must already exist');
    });
  });

  describe('remove-label', () => {
    it('should generate remove-label skill', () => {
      const result = generateSkillForOutput('remove-label', {}, []);

      expect(result).toContain('## Operation: Remove Labels');
      expect(result).toContain('mcp__github__issues_removeLabel');
      expect(result).toContain('mcp__github__pulls_removeLabel');
    });
  });

  describe('create-issue', () => {
    it('should generate create-issue skill with unlimited max', () => {
      const result = generateSkillForOutput('create-issue', {}, []);

      expect(result).toContain('## Operation: Create Issue');
      expect(result).toContain('mcp__github__issues_create');
      expect(result).toContain('Maximum issues: unlimited');
      expect(result).toContain('Required fields: title and body');
    });

    it('should include max constraint when specified', () => {
      const result = generateSkillForOutput('create-issue', { max: 3 }, []);

      expect(result).toContain('Maximum issues: 3');
    });
  });

  describe('create-pr', () => {
    it('should generate create-pr skill without signing', () => {
      const result = generateSkillForOutput('create-pr', {}, []);

      expect(result).toContain('## Operation: Create Pull Request');
      expect(result).toContain('mcp__github__pulls_create');
      expect(result).toContain('Create a new branch');
      expect(result).toContain('Maximum PRs: unlimited');
      expect(result).not.toContain('Commits must be signed');
    });

    it('should include signing requirement when configured', () => {
      const result = generateSkillForOutput('create-pr', { sign: true }, []);

      expect(result).toContain('Commits must be signed (configured)');
    });

    it('should include max constraint when specified', () => {
      const result = generateSkillForOutput('create-pr', { max: 1 }, []);

      expect(result).toContain('Maximum PRs: 1');
    });

    it('should include both signing and max when both specified', () => {
      const result = generateSkillForOutput('create-pr', { sign: true, max: 2 }, []);

      expect(result).toContain('Commits must be signed (configured)');
      expect(result).toContain('Maximum PRs: 2');
    });
  });

  describe('update-file', () => {
    it('should generate update-file skill without allowed paths', () => {
      const result = generateSkillForOutput('update-file', {}, undefined);

      expect(result).toContain('## Operation: Update Files');
      expect(result).toContain('Use the Edit tool');
      expect(result).not.toContain('Allowed paths');
    });

    it('should include allowed paths when specified', () => {
      const allowedPaths = ['src/**/*.ts', 'docs/**/*.md'];
      const result = generateSkillForOutput('update-file', {}, allowedPaths);

      expect(result).toContain('Allowed paths (glob patterns)');
      expect(result).toContain('`src/**/*.ts`');
      expect(result).toContain('`docs/**/*.md`');
      expect(result).toContain('Security notice');
      expect(result).toContain('Glob pattern examples');
    });

    it('should include signing requirement when configured', () => {
      const result = generateSkillForOutput('update-file', { sign: true }, []);

      expect(result).toContain('Commits must be signed (configured)');
    });

    it('should handle empty allowed paths array', () => {
      const result = generateSkillForOutput('update-file', {}, []);

      expect(result).not.toContain('Allowed paths');
    });

    it('should document glob pattern matching', () => {
      const allowedPaths = ['**/*.ts'];
      const result = generateSkillForOutput('update-file', {}, allowedPaths);

      expect(result).toContain('matches all TypeScript files');
      expect(result).toContain('Glob pattern examples');
    });
  });

  describe('close-issue', () => {
    it('should generate close-issue skill', () => {
      const result = generateSkillForOutput('close-issue', {}, []);

      expect(result).toContain('## Operation: Close Issue');
      expect(result).toContain('mcp__github__issues_update');
      expect(result).toContain('state: "closed"');
    });
  });

  describe('close-pr', () => {
    it('should generate close-pr skill', () => {
      const result = generateSkillForOutput('close-pr', {}, []);

      expect(result).toContain('## Operation: Close Pull Request');
      expect(result).toContain('mcp__github__pulls_update');
      expect(result).toContain('state: "closed"');
    });
  });

  describe('unknown output type', () => {
    it('should return empty string for unknown output', () => {
      const result = generateSkillForOutput('unknown-type' as Output, {}, []);

      expect(result).toBe('');
    });
  });

  describe('integration scenarios', () => {
    it('should handle all outputs together', () => {
      const outputs = {
        'add-comment': { max: 1 },
        'add-label': true,
        'create-pr': { sign: true },
        'update-file': { sign: true },
      };
      const allowedPaths = ['src/**/*.ts'];
      const result = generateSkillsSection(outputs, allowedPaths);

      expect(result).toContain('## Operation: Add Comment');
      expect(result).toContain('## Operation: Add Labels');
      expect(result).toContain('## Operation: Create Pull Request');
      expect(result).toContain('## Operation: Update Files');
      expect(result).toContain('Maximum comments: 1');
      expect(result).toContain('src/**/*.ts');
    });

    it('should handle outputs with complex configs', () => {
      const outputs = {
        'create-pr': {
          max: 1,
          sign: true,
          customField: 'value', // Extra fields should be allowed
        },
      };
      const result = generateSkillsSection(outputs);

      expect(result).toContain('Maximum PRs: 1');
      expect(result).toContain('Commits must be signed');
    });
  });
});
