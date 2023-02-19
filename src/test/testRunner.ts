import { runCLI } from '@jest/core';
import { AggregatedResult } from '@jest/test-result';
import util from 'util';
import path from 'path';

const getFailureMessages = (results: AggregatedResult): string[] | undefined => {
  const failures = results.testResults.reduce<string[]>(
    (acc, { failureMessage }) => (failureMessage ? [...acc, failureMessage] : acc),
    [],
  );

  return failures.length > 0 ? failures : undefined;
};

const rootDir = path.resolve(__dirname, '../..');

// vscode uses special mechanism to require node modules which interferes with jest-runtime and mocks functionality
// see https://bitly.com/ and https://bit.ly/3EmrV7c
const fixVscodeRuntime = () => {
  const globalTyped = global as unknown as { _VSCODE_NODE_MODULES: typeof Proxy };

  if (globalTyped._VSCODE_NODE_MODULES && util.types.isProxy(globalTyped._VSCODE_NODE_MODULES)) {
    globalTyped._VSCODE_NODE_MODULES = new Proxy(globalTyped._VSCODE_NODE_MODULES, {
      get(target, prop, receiver) {
        if (prop === '_isMockFunction') {
          return false;
        }

        return Reflect.get(target, prop, receiver);
      },
    });
  }
};

export function run(): Promise<void> {
  fixVscodeRuntime();

  process.stderr.write = (buffer: string) => {
    // ideally console.error should be used, but not possible due to stack overflow and how console methods are patched in vscode, see http://bit.ly/3vilufz
    // using original stdout/stderr not possible either, see this issue https://github.com/microsoft/vscode/issues/74173
    // child process simply swallows logs on using stdout/stderr.write, so parent process can't intercept test results.
    console.log(buffer);
    return true;
  };

  process.env.NODE_ENV = 'test';
  process.env.DISABLE_FILE_WATCHER = 'true';

  return new Promise(async (resolve, reject) => {
    try {
      const { results } = await runCLI(
        {
          rootDir,
          roots: ['<rootDir>/src'],
          verbose: true,
          colors: true,
          transform: JSON.stringify({
            '\\.ts$': ['@swc/jest'],
          }),
          runInBand: true,
          testRegex: process.env.JEST_TEST_REGEX || '\\.(test|spec)\\.ts$',
          testEnvironment: '<rootDir>/src/test/env/VsCodeEnvironment.js',
          setupFiles: ['<rootDir>/src/test/config/jestSetup.ts'],
          setupFilesAfterEnv: ['jest-extended/all'],
          ci: process.env.JEST_CI === 'true',
          testTimeout: 30000,
          watch: process.env.JEST_WATCH === 'true',
          collectCoverage: process.env.JEST_COLLECT_COVERAGE === 'true',
          useStderr: true,
          // Jest's runCLI requires special args to pass..
          _: [],
          $0: '',
        },
        [rootDir],
      );

      const failureMessages = getFailureMessages(results);

      if (failureMessages?.length) {
        return reject(`${failureMessages?.length} tests failed!`);
      }

      return resolve();
    } catch (error) {
      return reject(error);
    }
  });
}
