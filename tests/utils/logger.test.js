import { jest } from '@jest/globals';

const fileMock = jest.fn();
const consoleMock = jest.fn();

const loggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
  add: jest.fn(),
};
const createLoggerMock = jest.fn(() => loggerInstance);
const combineMock = jest.fn();
const timestampMock = jest.fn();
const errorsMock = jest.fn();
const jsonMock = jest.fn();
const simpleMock = jest.fn();

jest.unstable_mockModule('winston', () => ({
  default: {
    createLogger: createLoggerMock,
    format: {
      combine: combineMock,
      timestamp: timestampMock,
      errors: errorsMock,
      json: jsonMock,
      simple: simpleMock,
    },
    transports: {
      File: fileMock,
      Console: consoleMock,
    },
  },
  createLogger: createLoggerMock,
  format: {
    combine: combineMock,
    timestamp: timestampMock,
    errors: errorsMock,
    json: jsonMock,
    simple: simpleMock,
  },
  transports: {
    File: fileMock,
    Console: consoleMock,
  },
}));

const { default: logger } = await import('../../src/utils/logger.js');

describe('logger util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no agrega transport Console si NODE_ENV = production', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    await import('../../src/utils/logger.js');
    expect(consoleMock).not.toHaveBeenCalled();
  });

  it('permite usar info() y error()', () => {
    logger.info('msg');
    logger.error('err');
    expect(loggerInstance.info).toHaveBeenCalledWith('msg');
    expect(loggerInstance.error).toHaveBeenCalledWith('err');
  });
});
