import { commands } from 'vscode';

import {
  createFile,
  rndName,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('openRandomNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should open random note', async () => {
    const filenames = [`${rndName()}.md`, `${rndName()}.md`, `${rndName()}.md`];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');

    expect(getOpenedFilenames().some((filename) => filenames.includes(filename))).toBe(true);
  });

  it.skip('opens all random notes', async () => {
    const filenames = [`${rndName()}.md`, `${rndName()}.md`, `${rndName()}.md`];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    expect(getOpenedFilenames()).toEqual(expect.arrayContaining(filenames));
  });

  it('should open existing note only once on executing command multiple times', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename);

    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');
    await commands.executeCommand('memo.openRandomNote');

    expect(getOpenedFilenames()).toContain(filename);
  });
});
