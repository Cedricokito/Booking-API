module.exports = {
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 30000,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/dist/'
  ],
  moduleFileExtensions: ['js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Add custom resolver for module aliases if needed
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/src/$1'
  // }
}; 