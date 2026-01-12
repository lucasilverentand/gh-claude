import { addCommentHandler } from './add-comment';
import type { RuntimeContext } from './base';

describe('AddCommentHandler', () => {
  const mockRuntime: RuntimeContext = {
    repository: 'owner/repo',
    issueNumber: '42',
    prNumber: undefined,
    issueOrPrNumber: '42',
  };

  describe('handler properties', () => {
    it('should have correct name', () => {
      expect(addCommentHandler.name).toBe('add-comment');
    });
  });

  describe('getContextScript', () => {
    it('should return null (no dynamic context needed)', () => {
      const result = addCommentHandler.getContextScript(mockRuntime);
      expect(result).toBeNull();
    });
  });

  describe('generateSkill', () => {
    it('should generate skill documentation with unlimited max', () => {
      const config = {};
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('## Skill: Add Comment');
      expect(skill).toContain('/tmp/outputs/add-comment.json');
      expect(skill).toContain('Maximum comments: unlimited');
      expect(skill).toContain('body');
    });

    it('should generate skill documentation with max constraint', () => {
      const config = { max: 5 };
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('Maximum comments: 5');
    });

    it('should include JSON schema', () => {
      const config = {};
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('JSON Schema');
      expect(skill).toContain('"body": "string"');
    });

    it('should include example', () => {
      const config = {};
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('Example');
      expect(skill).toContain('Thank you for reporting this issue');
    });

    it('should mention numbered suffixes for multiple comments', () => {
      const config = {};
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('add-comment-1.json');
      expect(skill).toContain('add-comment-2.json');
    });

    it('should include important notes', () => {
      const config = {};
      const skill = addCommentHandler.generateSkill(config);

      expect(skill).toContain('Important');
      expect(skill).toContain('Use the Write tool');
    });
  });

  describe('generateValidationScript', () => {
    it('should generate validation script', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('find /tmp/outputs -name "add-comment*.json"');
      expect(script).toContain('jq empty');
      expect(script).toContain('COMMENT_BODY');
    });

    it('should validate body is non-empty', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('if [ -z "$COMMENT_BODY" ]');
      expect(script).toContain('Comment body is empty or missing');
    });

    it('should validate body length', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('65536');
      expect(script).toContain('Comment body exceeds');
    });

    it('should enforce max constraint when provided', () => {
      const config = { max: 3 };
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('if [ "$FILE_COUNT" -gt 3 ]');
      expect(script).toContain('Too many comment files');
      expect(script).toContain('Maximum allowed: 3');
    });

    it('should not enforce max constraint when not provided', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).not.toContain('Too many comment files');
    });

    it('should use runtime context for repository', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('owner/repo');
    });

    it('should check for issue/PR number', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('ISSUE_NUMBER="42"');
      expect(script).toContain('if [ -z "$ISSUE_NUMBER" ]');
      expect(script).toContain('No issue or PR number available');
    });

    it('should use GitHub API to post comment', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('gh api');
      expect(script).toContain('/issues/$ISSUE_NUMBER/comments');
      expect(script).toContain('-f body=');
    });

    it('should append workflow footer to comment', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('FOOTER=');
      expect(script).toContain('Generated by workflow');
      expect(script).toContain('COMMENT_BODY_WITH_FOOTER');
    });

    it('should implement atomic operation semantics', () => {
      const config = {};
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      expect(script).toContain('VALIDATION_FAILED=false');
      expect(script).toContain('if [ "$VALIDATION_FAILED" = false ]');
      expect(script).toContain('atomic operation');
    });
  });
});

