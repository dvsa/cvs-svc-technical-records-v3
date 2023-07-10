module.exports = {
  verbose: true,
  transform: {'\\.ts$': ['ts-jest']},
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageDirectory: '<rootDir>/coverage/',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  reporters: ['default', 'github-actions'],
  preset: "ts-jest",
  moduleNameMapper: {
    '@dvsa/cvs-type-definitions/lib/schemas': require.resolve('@dvsa/cvs-type-definitions/lib/schemas')
  }
};
