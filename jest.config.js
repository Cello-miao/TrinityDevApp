/** @type {import('jest').Config} */
module.exports = {
  silent: true,
  projects: [
    {
      displayName: "frontend",
      testEnvironment: "node",
      preset: "ts-jest",
      testMatch: ["<rootDir>/frontend/**/*.test.ts", "<rootDir>/frontend/**/*.test.tsx"],
      moduleFileExtensions: ["ts", "tsx", "js", "json"],
      collectCoverageFrom: ["frontend/lib/**/*.ts", "frontend/lib/**/*.tsx"],
      coverageDirectory: "<rootDir>/coverage/frontend",
    },
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: ["<rootDir>/backend/**/*.test.js"],
      collectCoverageFrom: [
        "backend/controllers/**/*.js",
        "backend/middleware/**/*.js",
        "!backend/config/**/*.js",
      ],
      coverageDirectory: "<rootDir>/coverage/backend",
    },
  ],
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
};
