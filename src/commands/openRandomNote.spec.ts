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
    const filenames = ['memo-note.md', 'memo-note-1.md', 'memo-note-2.md'];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(filenames).toContain(openedFilenames[0]);
  });

  it('opens random notes and does not try to open them again', async () => {
    const filenames = ['memo-note.md', 'memo-note-1.md', 'memo-note-2.md'];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(3);
    expect(openedFilenames).toEqual(expect.arrayContaining(filenames));
  });

  it('should open only one existing note on executing command multiple times', async () => {
    const filename = 'memo-note.md';

    await createFile(filename);

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(filename);
  });
});
