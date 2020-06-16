import { commands } from 'vscode';

import {
  createFile,
  rndName,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('openDocumentByReference command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should open a text document', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: name });

    expect(getOpenedFilenames()).toContain(filename);
  });

  it('should create a new text document if does not exist yet', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: name });

    expect(getOpenedFilenames()).toContain(`${name}.md`);
  });

  it('should open a text document from a reference with label', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await commands.executeCommand('_memo.openDocumentByReference', {
      reference: `${name}|Test Label`,
    });

    expect(getOpenedFilenames()).toContain(`${name}.md`);
  });

  it('should not open a reference on inexact filename match', async () => {
    const name = rndName();
    const filename = `${name}-test.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: 'test' });

    expect(getOpenedFilenames()).not.toContain(filename);
  });

  it('should open document regardless of reference case', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openDocumentByReference', {
      reference: name.toUpperCase(),
    });

    expect(getOpenedFilenames()).toContain(filename);
  });
});
