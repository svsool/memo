import { commands } from 'vscode';
import path from 'path';

import {
  createFile,
  rndName,
  getWorkspaceFolder,
  getOpenedFilenames,
  getOpenedPaths,
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

  it('should open document by a long ref', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);
    await createFile(`/folder1/${filename}`);

    await commands.executeCommand('_memo.openDocumentByReference', {
      reference: `/folder1/${name}`,
    });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, 'folder1', filename)}`);
  });
});
