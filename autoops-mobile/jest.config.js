module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@react-navigation/.*|jwt-decode))',
  ],
  resetMocks: false,
  clearMocks: false,
};
