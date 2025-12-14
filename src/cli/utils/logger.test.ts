import { Logger } from './logger';
import chalk from 'chalk';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('constructor', () => {
    it('should create logger with verbose disabled by default', () => {
      const logger = new Logger();

      logger.debug('test');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should create logger with verbose enabled when specified', () => {
      const logger = new Logger(true);

      logger.debug('test message');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.gray('[DEBUG]'), 'test message');
    });
  });

  describe('info', () => {
    it('should log info message with blue icon', () => {
      const logger = new Logger();

      logger.info('Information message');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.blue('ℹ'), 'Information message');
    });
  });

  describe('success', () => {
    it('should log success message with green checkmark', () => {
      const logger = new Logger();

      logger.success('Success message');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.green('✓'), 'Success message');
    });
  });

  describe('warn', () => {
    it('should log warning message with yellow icon', () => {
      const logger = new Logger();

      logger.warn('Warning message');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.yellow('⚠'), 'Warning message');
    });
  });

  describe('error', () => {
    it('should log error message with red X to stderr', () => {
      const logger = new Logger();

      logger.error('Error message');

      expect(mockConsoleError).toHaveBeenCalledWith(chalk.red('✗'), 'Error message');
    });
  });

  describe('debug', () => {
    it('should not log debug message when verbose is disabled', () => {
      const logger = new Logger(false);

      logger.debug('Debug message');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log debug message when verbose is enabled', () => {
      const logger = new Logger(true);

      logger.debug('Debug message');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.gray('[DEBUG]'), 'Debug message');
    });
  });

  describe('log', () => {
    it('should log plain message without formatting', () => {
      const logger = new Logger();

      logger.log('Plain message');

      expect(mockConsoleLog).toHaveBeenCalledWith('Plain message');
    });
  });

  describe('newline', () => {
    it('should log empty line', () => {
      const logger = new Logger();

      logger.newline();

      expect(mockConsoleLog).toHaveBeenCalledWith();
    });
  });

  describe('message formatting', () => {
    it('should handle empty strings', () => {
      const logger = new Logger();

      logger.info('');

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.blue('ℹ'), '');
    });

    it('should handle multiline messages', () => {
      const logger = new Logger();
      const multilineMessage = 'Line 1\nLine 2\nLine 3';

      logger.info(multilineMessage);

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.blue('ℹ'), multilineMessage);
    });

    it('should handle special characters', () => {
      const logger = new Logger();
      const specialMessage = 'Special: @#$%^&*()';

      logger.success(specialMessage);

      expect(mockConsoleLog).toHaveBeenCalledWith(chalk.green('✓'), specialMessage);
    });
  });

  describe('multiple log calls', () => {
    it('should handle multiple consecutive calls', () => {
      const logger = new Logger();

      logger.info('First');
      logger.success('Second');
      logger.warn('Third');

      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, chalk.blue('ℹ'), 'First');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, chalk.green('✓'), 'Second');
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, chalk.yellow('⚠'), 'Third');
    });
  });
});

