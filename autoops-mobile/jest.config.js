module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@react-navigation/.*|jwt-decode))',
  ],
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.ts',
  },
};
