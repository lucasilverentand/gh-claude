import { addCommentHandler } from './add-comment';
import type { RuntimeContext } from './base';

describe('AddCommentHandler', () => {
  const mockRuntime: RuntimeContext = {
    repository: 'owner/repo',
    issueNumber: '123',
  };

  describe('getContextScript', () => {
    it('should return null as no dynamic context is needed', () => {
      const result = addCommentHandler.getContextScript(mockRuntime);

      expect(result).toBeNull();
    });
  });

  describe('generateSkill', () => {
    it('should generate skill documentation with unlimited max', () => {
      const result = addCommentHandler.generateSkill({});

      expect(result).toContain('## Skill: Add Comment');
      expect(result).toContain('/tmp/outputs/add-comment.json');
      expect(result).toContain('Maximum comments: unlimited');
      expect(result).toContain('"body": "string"');
    });

    it('should include max constraint when specified', () => {
      const result = addCommentHandler.generateSkill({ max: 1 });

      expect(result).toContain('Maximum comments: 1');
    });

    it('should include max constraint with custom value', () => {
      const result = addCommentHandler.generateSkill({ max: 5 });

      expect(result).toContain('Maximum comments: 5');
    });

    it('should document multiple file naming convention', () => {
      const result = addCommentHandler.generateSkill({});

      expect(result).toContain('add-comment-1.json');
      expect(result).toContain('add-comment-2.json');
    });

    it('should include example JSON', () => {
      const result = addCommentHandler.generateSkill({});

      expect(result).toContain('Example');
      expect(result).toContain('Thank you for reporting this issue');
    });

    it('should mention using Write tool', () => {
      const result = addCommentHandler.generateSkill({});

      expect(result).toContain('Use the Write tool');
    });
  });

  describe('generateValidationScript', () => {
    it('should generate validation script with issue number', () => {
      const runtime: RuntimeContext = {
        repository: 'owner/repo',
        issueNumber: '42',
      };
      const result = addCommentHandler.generateValidationScript({}, runtime);

      expect(result).toContain('find /tmp/outputs -name "add-comment*.json"');
      expect(result).toContain('ISSUE_NUMBER="42"');
      expect(result).toContain('repos/owner/repo/issues/42/comments');
    });

    it('should generate validation script with PR number', () => {
      const runtime: RuntimeContext = {
        repository: 'owner/repo',
        prNumber: '99',
      };
      const result = addCommentHandler.generateValidationScript({}, runtime);

      expect(result).toContain('ISSUE_NUMBER="99"');
      expect(result).toContain('repos/owner/repo/issues/99/comments');
    });

    it('should prefer issue number over PR number', () => {
      const runtime: RuntimeContext = {
        repository: 'owner/repo',
        issueNumber: '42',
        prNumber: '99',
      };
      const result = addCommentHandler.generateValidationScript({}, runtime);

      expect(result).toContain('ISSUE_NUMBER="42"');
    });

    it('should include max constraint check when specified', () => {
      const result = addCommentHandler.generateValidationScript({ max: 2 }, mockRuntime);

      expect(result).toContain('if [ "$FILE_COUNT" -gt 2 ]');
      expect(result).toContain('Maximum allowed: 2');
    });

    it('should not include max constraint check when unlimited', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).not.toContain('if [ "$FILE_COUNT" -gt');
      expect(result).not.toContain('Maximum allowed:');
    });

    it('should validate JSON structure', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('jq empty "$comment_file"');
      expect(result).toContain('Invalid JSON format');
    });

    it('should validate body is non-empty', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('COMMENT_BODY=$(jq -r \'.body\' "$comment_file")');
      expect(result).toContain('Comment body is empty or missing');
    });

    it('should validate body length', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('\${#COMMENT_BODY} -gt 65536');
      expect(result).toContain('exceeds 65536 characters');
    });

    it('should validate issue/PR number exists', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('if [ -z "$ISSUE_NUMBER" ]');
      expect(result).toContain('No issue or PR number available');
    });

    it('should use atomic validation (all or nothing)', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('VALIDATION_FAILED=false');
      expect(result).toContain('if [ "$VALIDATION_FAILED" = false ]');
      expect(result).toContain('atomic operation');
    });

    it('should execute GitHub API call after validation passes', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('gh api "repos/owner/repo/issues/123/comments"');
      expect(result).toContain('-f body="$COMMENT_BODY"');
    });

    it('should handle API failure', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('Failed to post comment from $comment_file via GitHub API');
    });

    it('should write validation errors to specific file', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('/tmp/validation-errors/add-comment.txt');
    });

    it('should support multiple comment files', () => {
      const result = addCommentHandler.generateValidationScript({}, mockRuntime);

      expect(result).toContain('for comment_file in $COMMENT_FILES');
      expect(result).toContain('FILE_COUNT=$(echo "$COMMENT_FILES" | wc -l)');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow with max constraint', () => {
      const config = { max: 1 };
      const runtime: RuntimeContext = {
        repository: 'test/repo',
        issueNumber: '10',
      };

      const skill = addCommentHandler.generateSkill(config);
      const script = addCommentHandler.generateValidationScript(config, runtime);

      // Skill mentions the constraint
      expect(skill).toContain('Maximum comments: 1');

      // Script enforces the constraint
      expect(script).toContain('if [ "$FILE_COUNT" -gt 1 ]');
      expect(script).toContain('repos/test/repo/issues/10/comments');
    });

    it('should handle PR context correctly', () => {
      const runtime: RuntimeContext = {
        repository: 'owner/repo',
        prNumber: '456',
      };

      const script = addCommentHandler.generateValidationScript({}, runtime);

      // PR comments use the same API endpoint as issues
      expect(script).toContain('repos/owner/repo/issues/456/comments');
    });

    it('should generate consistent documentation and validation', () => {
      const config = { max: 3 };

      const skill = addCommentHandler.generateSkill(config);
      const script = addCommentHandler.generateValidationScript(config, mockRuntime);

      // Both should mention the same max value
      expect(skill).toContain('3');
      expect(script).toContain('3');
    });
  });

  describe('edge cases', () => {
    it('should handle repository with special characters', () => {
      const runtime: RuntimeContext = {
        repository: 'my-org/my-repo',
        issueNumber: '1',
      };

      const script = addCommentHandler.generateValidationScript({}, runtime);

      expect(script).toContain('repos/my-org/my-repo/issues/1/comments');
    });

    it('should handle max=0 (no comments allowed)', () => {
      const result = addCommentHandler.generateValidationScript({ max: 0 }, mockRuntime);

      expect(result).toContain('if [ "$FILE_COUNT" -gt 0 ]');
    });

    it('should handle runtime without issue or PR number', () => {
      const runtime: RuntimeContext = {
        repository: 'owner/repo',
      };

      const script = addCommentHandler.generateValidationScript({}, runtime);

      // Should still generate script but will fail validation
      expect(script).toContain('ISSUE_NUMBER=""');
      expect(script).toContain('No issue or PR number available');
    });
  });
});

