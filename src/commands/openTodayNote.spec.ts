import { commands } from 'vscode';
import fs from 'fs';

import { getDateInYYYYMMDDFormat, getWorkspaceFolder } from '../utils';
import {
  createFile,
  getOpenedFilenames,
  closeAllEditors,
  cleanWorkspace,
  cleanWorkspaceCache,
} from '../test/utils';

describe('openTodayNote command', () => {
  beforeEach(async () => {
    await closeAllEditors();
    await cleanWorkspaceCache();
  });

  afterEach(async () => {
    await closeAllEditors();
    cleanWorkspace();
    await cleanWorkspaceCache();
  });

  it("should open today's note if note already exists", async () => {
    const filename = `${getDateInYYYYMMDDFormat()}.md`;

    await createFile(filename);

    await commands.executeCommand('memo.openTodayNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(filename);
  });

  it("should open today's note if note does not exist", async () => {
    const filename = `${getDateInYYYYMMDDFormat()}.md`;

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openTodayNote');

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(filename);
  });
});
