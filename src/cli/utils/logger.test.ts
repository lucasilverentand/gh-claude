import { Logger } from './logger';
import chalk from 'chalk';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages with blue icon', () => {
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(chalk.blue('ℹ'), 'test message');
    });

    it('should handle empty messages', () => {
      logger.info('');

      expect(consoleLogSpy).toHaveBeenCalledWith(chalk.blue('ℹ'), '');
    });
  });

  describe('success', () => {
    it('should log success messages with green checkmark', () => {
      logger.success('operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith(chalk.green('✓'), 'operation completed');
    });
  });

  describe('warn', () => {
    it('should log warning messages with yellow icon', () => {
      logger.warn('warning message');

      expect(consoleLogSpy).toHaveBeenCalledWith(chalk.yellow('⚠'), 'warning message');
    });
  });

  describe('error', () => {
    it('should log error messages with red icon to stderr', () => {
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('✗'), 'error message');
    });

    it('should use console.error instead of console.log', () => {
      logger.error('critical error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should not log debug messages by default', () => {
      logger.debug('debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages when verbose mode is enabled', () => {
      const verboseLogger = new Logger(true);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      verboseLogger.debug('debug message');

      expect(spy).toHaveBeenCalledWith(chalk.gray('[DEBUG]'), 'debug message');

      spy.mockRestore();
    });
  });

  describe('log', () => {
    it('should log plain messages without formatting', () => {
      logger.log('plain message');

      expect(consoleLogSpy).toHaveBeenCalledWith('plain message');
    });

    it('should handle messages with existing formatting', () => {
      const formatted = chalk.cyan('colored text');
      logger.log(formatted);

      expect(consoleLogSpy).toHaveBeenCalledWith(formatted);
    });
  });

  describe('newline', () => {
    it('should log an empty line', () => {
      logger.newline();

      expect(consoleLogSpy).toHaveBeenCalledWith();
    });

    it('should be callable multiple times', () => {
      logger.newline();
      logger.newline();
      logger.newline();

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('verbose mode', () => {
    it('should be disabled by default', () => {
      const defaultLogger = new Logger();
      const spy = jest.spyOn(console, 'log').mockImplementation();

      defaultLogger.debug('should not appear');

      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should be enabled when passed true to constructor', () => {
      const verboseLogger = new Logger(true);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      verboseLogger.debug('should appear');

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should not affect other log methods', () => {
      const verboseLogger = new Logger(true);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      verboseLogger.info('info message');
      verboseLogger.success('success message');
      verboseLogger.warn('warning message');

      expect(spy).toHaveBeenCalledTimes(3);

      spy.mockRestore();
    });
  });

  describe('integration', () => {
    it('should support chaining different log levels', () => {
      logger.info('step 1');
      logger.success('step 2');
      logger.warn('step 3');
      logger.newline();
      logger.log('summary');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });
  });
});

