import { handler } from './create-issue';
import type { RuntimeContext } from './base';

describe('CreateIssueHandler', () => {
  const mockRuntime: RuntimeContext = {
    repository: 'owner/repo',
    issueNumber: undefined,
    prNumber: undefined,
    issueOrPrNumber: undefined,
  };

  describe('handler properties', () => {
    it('should have correct name', () => {
      expect(handler.name).toBe('create-issue');
    });
  });

  describe('getContextScript', () => {
    it('should return null (no dynamic context needed)', () => {
      const result = handler.getContextScript(mockRuntime);
      expect(result).toBeNull();
    });
  });

  describe('generateSkill', () => {
    it('should generate skill documentation with unlimited max', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('## Skill: Create Issue');
      expect(skill).toContain('/tmp/outputs/create-issue.json');
      expect(skill).toContain('Maximum issues: unlimited');
    });

    it('should generate skill documentation with max constraint', () => {
      const config = { max: 3 };
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Maximum issues: 3');
    });

    it('should include JSON schema', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('JSON Schema');
      expect(skill).toContain('"title": "string"');
      expect(skill).toContain('"body": "string"');
      expect(skill).toContain('"labels": ["string"] (optional)');
      expect(skill).toContain('"assignees": ["string"] (optional)');
    });

    it('should document all fields', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('title (required)');
      expect(skill).toContain('body (required)');
      expect(skill).toContain('labels (optional)');
      expect(skill).toContain('assignees (optional)');
    });

    it('should include constraints', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Constraints');
      expect(skill).toContain('Title must be non-empty');
      expect(skill).toContain('Body should provide sufficient context');
    });

    it('should include example', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('Example');
      expect(skill).toContain('Add support for custom configurations');
      expect(skill).toContain('Acceptance Criteria');
    });

    it('should mention numbered suffixes for multiple issues', () => {
      const config = {};
      const skill = handler.generateSkill(config);

      expect(skill).toContain('create-issue-1.json');
      expect(skill).toContain('create-issue-2.json');
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

      expect(script).toContain('find /tmp/outputs -name "create-issue*.json"');
      expect(script).toContain('jq empty');
    });

    it('should enforce max constraint when provided', () => {
      const config = { max: 5 };
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('if [ "$FILE_COUNT" -gt 5 ]');
      expect(script).toContain('Too many issue files');
      expect(script).toContain('Maximum allowed: 5');
    });

    it('should not enforce max constraint when not provided', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).not.toContain('Too many issue files');
    });

    it('should validate title is required', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('TITLE=$(jq -r \'.title\'');
      expect(script).toContain('if [ -z "$TITLE" ] || [ "$TITLE" = "null" ]');
      expect(script).toContain('title is required');
    });

    it('should validate body is required', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('BODY=$(jq -r \'.body\'');
      expect(script).toContain('if [ -z "$BODY" ] || [ "$BODY" = "null" ]');
      expect(script).toContain('body is required');
    });

    it('should validate title length', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('256');
      expect(script).toContain('title exceeds');
    });

    it('should extract and validate labels', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('LABELS=$(jq -r \'.labels // [] | @json\'');
      expect(script).toContain('if [ "$LABELS" != "[]" ]');
    });

    it('should fetch existing labels when validating', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('EXISTING_LABELS=$(gh api "repos/owner/repo/labels"');
      expect(script).toContain('if [ -z "$EXISTING_LABELS" ]');
    });

    it('should validate each label exists in repository', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('for label in $(echo "$LABELS" | jq -r \'.[]\');');
      expect(script).toContain('index($label)');
      expect(script).toContain('Label');
      expect(script).toContain('does not exist');
    });

    it('should extract assignees', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('ASSIGNEES=$(jq -r \'.assignees // [] | @json\'');
    });

    it('should build API payload with all fields', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('PAYLOAD=$(jq -n');
      expect(script).toContain('--arg title "$TITLE"');
      expect(script).toContain('--arg body "$BODY"');
      expect(script).toContain('--argjson labels "$LABELS"');
      expect(script).toContain('--argjson assignees "$ASSIGNEES"');
    });

    it('should use GitHub API to create issue', () => {
      const config = {};
      const script = handler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('gh api "repos/owner/repo/issues"');
      expect(script).toContain('--input -');
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

