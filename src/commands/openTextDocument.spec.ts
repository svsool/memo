import { commands } from 'vscode';

import { cleanWorkspace, createFile, getOpenedFilenames, closeAllEditors } from '../test/utils';

describe('openTextDocument command', () => {
  beforeEach(async () => {
    await closeAllEditors();
  });

  afterEach(async () => {
    cleanWorkspace();
    await closeAllEditors();
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
