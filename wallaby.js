const path = require("path");
module.exports = wallaby => {
  process.env.NODE_PATH +=
    path.delimiter + path.join(wallaby.projectCacheDir, "packages");
  /* eslint-disable no-path-concat */
  return {
    files: [
      {
        pattern: "packages/**",
        load: true
      },
      {
        pattern: "jest.*.js",
        instrument: false
      },
      {
        pattern: "packages/**/node_modules/**",
        ignore: true
      },
      {
        pattern: "packages/*/dist/**",
        ignore: true
      },
      {
        pattern: "packages/**/*.test.js",
        ignore: true
      }
    ],
    tests: [
      {
        pattern: "packages/**/*.test.js"
      },
      {
        pattern: "packages/**/dist/*.test.js",
        ignore: true
      },
      {
        pattern: "packages/**/node_modules/**",
        ignore: true
      }
    ],
    compilers: {
      "**/*.js": wallaby.compilers.babel()
    },
    env: {
      type: "node"
    },
    setup: w => {
      const jestConfig = require("./jest.config");
      jestConfig.moduleNameMapper = {
        "^@emitterware/(.+)": w.projectCacheDir + "/packages/$1"
      };
      wallaby.testFramework.configure(jestConfig);
    },
    testFramework: "jest",
    debug: true,
    reportConsoleErrorAsError: true
  };
};
