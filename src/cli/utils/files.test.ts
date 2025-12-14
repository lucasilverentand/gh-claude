import { toKebabCase, agentNameToWorkflowName, findMarkdownFiles, fileExists } from './files';
import { writeFileSync, mkdtempSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('files utils', () => {
  describe('toKebabCase', () => {
    it('should convert spaces to hyphens', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(toKebabCase('UPPERCASE')).toBe('uppercase');
    });

    it('should remove special characters', () => {
      expect(toKebabCase('Hello@World!')).toBe('helloworld');
    });

    it('should handle multiple spaces', () => {
      expect(toKebabCase('Hello   World')).toBe('hello-world');
    });

    it('should handle mixed case and spaces', () => {
      expect(toKebabCase('My Agent Name')).toBe('my-agent-name');
    });

    it('should handle already kebab-case', () => {
      expect(toKebabCase('already-kebab')).toBe('already-kebab');
    });
  });

  describe('agentNameToWorkflowName', () => {
    it('should prefix with claude-', () => {
      expect(agentNameToWorkflowName('Test Agent')).toBe('claude-test-agent');
    });

    it('should handle complex names', () => {
      expect(agentNameToWorkflowName('My Complex Agent Name')).toBe('claude-my-complex-agent-name');
    });

    it('should remove special characters', () => {
      expect(agentNameToWorkflowName('Test@Agent!')).toBe('claude-testagent');
    });
  });

  describe('findMarkdownFiles', () => {
    it('should find markdown files', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      writeFileSync(join(tempDir, 'file1.md'), 'test');
      writeFileSync(join(tempDir, 'file2.md'), 'test');
      writeFileSync(join(tempDir, 'file3.txt'), 'test');

      const files = await findMarkdownFiles(tempDir);

      expect(files).toHaveLength(2);
      expect(files[0]).toContain('file1.md');
      expect(files[1]).toContain('file2.md');
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await findMarkdownFiles('/non/existent/path');
      expect(files).toEqual([]);
    });

    it('should return sorted files', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      writeFileSync(join(tempDir, 'zebra.md'), 'test');
      writeFileSync(join(tempDir, 'alpha.md'), 'test');

      const files = await findMarkdownFiles(tempDir);

      expect(files[0]).toContain('alpha.md');
      expect(files[1]).toContain('zebra.md');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'test content');

      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return true for existing directory', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'gh-claude-test-'));
      const dirPath = join(tempDir, 'subdir');
      mkdirSync(dirPath);

      const exists = await fileExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await fileExists('/non/existent/file.txt');
      expect(exists).toBe(false);
    });

    it('should return false for non-existent directory', async () => {
      const exists = await fileExists('/non/existent/directory');
      expect(exists).toBe(false);
    });
  });
});
