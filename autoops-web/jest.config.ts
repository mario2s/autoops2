import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/__tests__/api/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: '<rootDir>/src/__tests__/api/globalSetup.ts',
  testSequencer: '<rootDir>/src/__tests__/api/sequencer.cjs',
  reporters: ['default', '<rootDir>/src/__tests__/api/reporter.cjs'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: false,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
};

export default config;
