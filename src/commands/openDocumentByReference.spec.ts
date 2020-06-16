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

  it('should open text document', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: name });

    expect(getOpenedFilenames()).toContain(filename);
  });

  it('should create new text document if one does not exist', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: name });

    expect(getOpenedFilenames()).toContain(`${name}.md`);
  });

  it('should open text document based on reference with label', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await commands.executeCommand('_memo.openDocumentByReference', {
      reference: `${name}|Test Label`,
    });

    expect(getOpenedFilenames()).toContain(`${name}.md`);
  });

  it('should not open reference with inexact name match', async() => {
    const name = rndName();
    const filename = `${name}-test.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openDocumentByReference', { reference: 'test' });

    expect(getOpenedFilenames()).not.toContain(filename);
  });
});
