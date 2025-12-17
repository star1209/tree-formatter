module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/worker/**/*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  /* transform: {
    '^.+\\.ts$': 'ts-jest'
  }, */
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      // 如果遇到模块问题，可以尝试启用 isolatedModules
      // isolatedModules: true,
      // useESM: false, // 根据你的项目是否为ESM模块调整
    }],
  },
  
  // 确保 Jest 能正确处理 .ts 扩展名
  extensionsToTreatAsEsm: ['.ts'],
  /* globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  } */
};