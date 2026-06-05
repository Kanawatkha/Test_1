/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    cacheDirectory: '.jest_cache',
    roots: ['<rootDir>/src'],
    testRegex: '(.*.(test|spec)).(jsx?|tsx?|ts?)$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverage: true,
    collectCoverageFrom: [
      '**/src/**/*.ts',
      '!**/node_modules/**',
      '!**/*.test.data.ts',
    ],
    coverageThreshold: {
      global: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 80,
      },
    },
    // workerIdleMemoryLimit: '1024MB',
    maxWorkers: '50%',
    // fakeTimers: {'enableGlobally': true},
    reporters: [
      'default',
      [
        'jest-junit',
        {
          outputDirectory: 'test-reports',
          outputName: 'junit-unit-test.xml',
        },
      ],
    ],
    coveragePathIgnorePatterns: [
      '.*test\\.data\\.ts$,migrations.*.ts$,(.*.(test|spec)).(jsx?|tsx?)$,(tests/.*.mock).(jsx?|tsx?)$',
    ],
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'cobertura'],
    verbose: true,
    coverageProvider: 'v8'
  };
