import * as path from 'path';
import { runTests } from '@vscode/test-electron';

process.env.FORCE_COLOR = '1';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './testRunner');

    // Temp workspace dir re-created automatically see precompile:tests script in package.json
    const tmpWorkspaceDir = path.join(extensionDevelopmentPath, 'tmp', 'test-workspace');

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [tmpWorkspaceDir, '--disable-extensions', '--disable-workspace-trust'],
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
