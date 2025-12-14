import { isGitRepository, hasGitHubRemote, getGitHubRepo, hasGitHubDirectory } from './git';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Mock child_process and fs modules
jest.mock('child_process');
jest.mock('fs');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('git utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', () => {
      mockedExecSync.mockReturnValue(Buffer.from('.git'));

      const result = isGitRepository('/test/repo');

      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --git-dir', {
        cwd: '/test/repo',
        stdio: 'ignore',
      });
    });

    it('should return false when not in a git repository', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('not a git repository');
      });

      const result = isGitRepository('/not/a/repo');

      expect(result).toBe(false);
    });

    it('should use process.cwd() as default', () => {
      mockedExecSync.mockReturnValue(Buffer.from('.git'));

      isGitRepository();

      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --git-dir', {
        cwd: process.cwd(),
        stdio: 'ignore',
      });
    });
  });

  describe('hasGitHubRemote', () => {
    it('should return true when remote URL contains github.com', () => {
      mockedExecSync.mockReturnValue(Buffer.from('https://github.com/user/repo.git'));

      const result = hasGitHubRemote('/test/repo');

      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith('git remote get-url origin', {
        cwd: '/test/repo',
        encoding: 'utf-8',
      });
    });

    it('should return true for SSH GitHub URLs', () => {
      mockedExecSync.mockReturnValue(Buffer.from('git@github.com:user/repo.git'));

      const result = hasGitHubRemote();

      expect(result).toBe(true);
    });

    it('should return false when remote is not GitHub', () => {
      mockedExecSync.mockReturnValue(Buffer.from('https://gitlab.com/user/repo.git'));

      const result = hasGitHubRemote();

      expect(result).toBe(false);
    });

    it('should return false when no remote exists', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('no remote found');
      });

      const result = hasGitHubRemote();

      expect(result).toBe(false);
    });
  });

  describe('getGitHubRepo', () => {
    it('should parse HTTPS GitHub URL', () => {
      mockedExecSync.mockReturnValue('https://github.com/owner/repo.git\n');

      const result = getGitHubRepo();

      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH GitHub URL', () => {
      mockedExecSync.mockReturnValue('git@github.com:owner/repo.git\n');

      const result = getGitHubRepo();

      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL without .git extension', () => {
      mockedExecSync.mockReturnValue('https://github.com/owner/repo\n');

      const result = getGitHubRepo();

      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for non-GitHub remote', () => {
      mockedExecSync.mockReturnValue('https://gitlab.com/owner/repo.git\n');

      const result = getGitHubRepo();

      expect(result).toBeNull();
    });

    it('should return null when no remote exists', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('no remote found');
      });

      const result = getGitHubRepo();

      expect(result).toBeNull();
    });

    it('should handle malformed URLs', () => {
      mockedExecSync.mockReturnValue('not-a-valid-url\n');

      const result = getGitHubRepo();

      expect(result).toBeNull();
    });
  });

  describe('hasGitHubDirectory', () => {
    it('should return true when .github directory exists', () => {
      mockedExistsSync.mockReturnValue(true);

      const result = hasGitHubDirectory('/test/repo');

      expect(result).toBe(true);
      expect(mockedExistsSync).toHaveBeenCalledWith(join('/test/repo', '.github'));
    });

    it('should return false when .github directory does not exist', () => {
      mockedExistsSync.mockReturnValue(false);

      const result = hasGitHubDirectory('/test/repo');

      expect(result).toBe(false);
    });

    it('should use process.cwd() as default', () => {
      mockedExistsSync.mockReturnValue(true);

      hasGitHubDirectory();

      expect(mockedExistsSync).toHaveBeenCalledWith(join(process.cwd(), '.github'));
    });
  });
});

