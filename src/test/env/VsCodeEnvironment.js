const { TestEnvironment } = require('jest-environment-node');
const vscode = require('vscode');

class VsCodeEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();

    this.global.vscode = vscode;

    // Expose RegExp otherwise document.getWordRangeAtPosition won't work as supposed.
    // Implementation of getWordRangeAtPosition uses "instanceof RegExp" which returns false
    // due to Jest running tests in the different vm context.
    // See https://github.com/nodejs/node-v0.x-archive/issues/1277.
    this.global.RegExp = RegExp;
  }

  async teardown() {
    this.global.vscode = {};
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = VsCodeEnvironment;
