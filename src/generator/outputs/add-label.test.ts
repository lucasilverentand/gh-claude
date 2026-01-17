import { handler } from './add-label';
import type { RuntimeContext } from './base';

describe('AddLabelHandler', () => {
  const mockRuntime: RuntimeContext = {
    repository: 'owner/repo',
    issueNumber: '123',
    prNumber: undefined,
    issueOrPrNumber: '123',
  };

  describe('handler properties', () => {
    it('should have correct name', () => {
      expect(handler.name).toBe('add-label');
    });
  });

  describe('getContextScript', () => {
    it('should return script to fetch available labels', () => {
      const result = handler.getContextScript(mockRuntime);

      expect(result).not.toBeNull();
      expect(result).toContain('gh api "repos/owner/repo/labels"');
      expect(result).toContain('LABELS_JSON');
      expect(result).toContain('LABELS_LIST');
    });

    it('should include available labels section in context', () => {
      const result = handler.getContextScript(mockRuntime);

      expect(result).toContain('## Available Repository Labels');
      expect(result).toContain('You can only add labels that already exist');
    });

    it('should append to context.txt file', () => {
      const result = handler.getContextScript(mockRuntime);

      expect(result).toContain('cat >> /tmp/context.txt');
      expect(result).toContain('LABELS_EOF');
    });
  });

  describe('generateSkill', () => {
    it('should generate skill documentation', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('## Skill: Add Labels');
      expect(skill).toContain('/tmp/outputs/add-label.json');
      expect(skill).toContain('Available labels');
    });

    it('should include JSON schema', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('JSON Schema');
      expect(skill).toContain('"labels": ["string"]');
    });

    it('should include constraints', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Constraints');
      expect(skill).toContain('Labels must already exist');
      expect(skill).toContain('Labels array must be non-empty');
      expect(skill).toContain('adds to existing labels');
    });

    it('should include example', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Example');
      expect(skill).toContain('bug');
      expect(skill).toContain('priority: high');
    });

    it('should mention numbered suffixes', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('add-label-1.json');
      expect(skill).toContain('add-label-2.json');
    });

    it('should include important notes', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Important');
      expect(skill).toContain('Use the Write tool');
    });
  });

  describe('generateValidationScript', () => {
    it('should generate validation script', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('find /tmp/outputs -name "add-label*.json"');
      expect(script).toContain('jq empty');
      expect(script).toContain('LABELS_ARRAY');
    });

    it('should validate labels is an array', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('type == "array"');
      expect(script).toContain('labels field must be an array');
    });

    it('should validate labels array is non-empty', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('length');
      expect(script).toContain('labels array cannot be empty');
    });

    it('should fetch existing labels from repository', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('EXISTING_LABELS=$(gh api "repos/owner/repo/labels"');
    });

    it('should validate each label exists in repository', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('for label in $(echo "$LABELS_ARRAY" | jq -r \'.[]\');');
      expect(script).toContain('index($label)');
      expect(script).toContain('INVALID_LABELS');
    });

    it('should merge labels from multiple files', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('ALL_LABELS=$(echo "$ALL_LABELS" "$LABELS_ARRAY" | jq -s \'add | unique\')');
    });

    it('should check for issue/PR number', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('ISSUE_NUMBER="123"');
      expect(script).toContain('if [ -z "$ISSUE_NUMBER" ]');
      expect(script).toContain('No issue or PR number available');
    });

    it('should merge with current labels to avoid overwriting', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('CURRENT_LABELS=$(gh api "repos/owner/repo/issues/$ISSUE_NUMBER"');
      expect(script).toContain('MERGED_LABELS=$(echo "$CURRENT_LABELS" "$ALL_LABELS" | jq -s \'add | unique\')');
    });

    it('should use GitHub API with PUT method to set labels', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('gh api "repos/owner/repo/issues/$ISSUE_NUMBER/labels"');
      expect(script).toContain('-X PUT');
    });

    it('should implement atomic operation semantics', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('VALIDATION_FAILED=false');
      expect(script).toContain('if [ "$VALIDATION_FAILED" = false ]');
      expect(script).toContain('atomic operation');
    });

    it('should use runtime context for repository', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('owner/repo');
    });
  });
});

