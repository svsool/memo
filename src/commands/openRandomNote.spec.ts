import { commands } from 'vscode';

import { cleanWorkspace, createFile, getOpenedFilenames, closeAllEditors } from '../test/utils';

describe('openRandomNote command', () => {
  beforeEach(async () => {
    await closeAllEditors();
  });

  afterEach(async () => {
    cleanWorkspace();
    await closeAllEditors();
  });

  it('should open random note', async () => {
    const fileNames = ['memo-note.md', 'memo-note-1.md', 'memo-note-2.md'];

    await Promise.all(fileNames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(fileNames).toContain(openedFilenames[0]);
  });

  it('opens random notes and does not try to open them again', async () => {
    const fileNames = ['memo-note.md', 'memo-note-1.md', 'memo-note-2.md'];

    await Promise.all(fileNames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(3);
    expect(openedFilenames).toEqual(expect.arrayContaining(fileNames));
  });

  it('should open only one existing note on executing command multiple times', async () => {
    const fileName = 'memo-note.md';

    await createFile(fileName);

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(fileName);
  });
});
