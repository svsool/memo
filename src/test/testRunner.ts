import { runCLI } from '@jest/core';
import { AggregatedResult } from '@jest/test-result';
import path from 'path';

const getFailureMessages = (results: AggregatedResult): string[] | undefined => {
  const failures = results.testResults.reduce<string[]>(
    (acc, { failureMessage }) => (failureMessage ? [...acc, failureMessage] : acc),
    [],
  );

  return failures.length > 0 ? failures : undefined;
};

const rootDir = path.resolve(__dirname, '../..');

export function run(): Promise<void> {
  process.stdout.write = (buffer: string) => {
    console.log(buffer);
    return true;
  };
  process.stderr.write = (buffer: string) => {
    console.error(buffer);
    return true;
  };

  return new Promise(async (resolve, reject) => {
    try {
      const { results } = await (runCLI as any)(
        {
          rootDir,
          roots: ['<rootDir>/src'],
          verbose: true,
          colors: true,
          transform: JSON.stringify({ '^.+\\.ts$': 'ts-jest' }),
          runInBand: true,
          testRegex: process.env.JEST_TEST_REGEX || '\\.(test|spec)\\.ts$',
          testEnvironment: '<rootDir>/src/test/env/ExtendedVscodeEnvironment.js',
          setupFilesAfterEnv: ['<rootDir>/src/test/config/jestSetupAfterEnv.ts'],
          globals: JSON.stringify({
            'ts-jest': {
              tsConfig: path.resolve(rootDir, './tsconfig.json'),
            },
          }),
          watch: process.env.JEST_WATCH === 'true',
          collectCoverage: process.env.JEST_COLLECT_COVERAGE === 'true',
          testLocationInResults: process.env.JEST_TEST_LOCATION_IN_RESULTS === 'true',
          json: process.env.JEST_JSON === 'true',
          outputFile: process.env.JEST_JSON === 'true' ? 'jest.results.json' : undefined,
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
