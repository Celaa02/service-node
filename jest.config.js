// jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s', '**/?(*.)+(test|spec).[jt]s', '**/tests/**/*.[jt]s'],
  transform: {},
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // ignora el entrypoint
    '!src/**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/config/',
    '/src/routes/',
    '/src/services/validations',
    '/src/domain/repositories',
    '/src/domain/models',
    '/src/utils/logger.js',
    '/src/utils/mailer.js',
    '/src/middleware/rateLimiter.js',
  ],
};
