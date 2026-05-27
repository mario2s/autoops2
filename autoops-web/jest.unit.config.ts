import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  // Unit + component live here; the API integration suite stays in src/__tests__/api
  testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts', '<rootDir>/src/__tests__/components/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^jose$': '<rootDir>/src/__tests__/unit/__mocks__/jose.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
};

export default config;
