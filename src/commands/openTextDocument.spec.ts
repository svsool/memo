import { commands } from 'vscode';

import {
  createFile,
  getOpenedFilenames,
  closeAllEditors,
  cleanWorkspace,
  cleanWorkspaceCache,
} from '../test/utils';

describe('openTextDocument command', () => {
  beforeEach(async () => {
    await closeAllEditors();
    await cleanWorkspaceCache();
  });

  afterEach(async () => {
    await closeAllEditors();
    cleanWorkspace();
    await cleanWorkspaceCache();
  });

  it('should open text document', async () => {
    const filename = 'memo-note.md';

    await createFile(filename);

    await commands.executeCommand('_memo.openTextDocument', { reference: 'memo-note' });

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(filename);
  });

  it('should create new text document if one does not exist', async () => {
    expect(getOpenedFilenames()).toHaveLength(0);

    await commands.executeCommand('_memo.openTextDocument', { reference: 'memo-note' });

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe('memo-note.md');
  });
});
