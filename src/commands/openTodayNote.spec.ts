import { commands } from 'vscode';
import fs from 'fs';

import { getDateInYYYYMMDDFormat } from '../utils';
import {
  createFile,
  getWorkspaceFolder,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
} from '../test/testUtils';

describe('openTodayNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it("should open today's note if note already exists", async () => {
    const filename = `${getDateInYYYYMMDDFormat()}.md`;

    await createFile(filename, '# Hello world');

    await commands.executeCommand('memo.openTodayNote');

    expect(getOpenedFilenames()).toContain(filename);

    const doc = await openTextDocument(filename);

    expect(doc.getText()).toBe('# Hello world');
  });

  it("should open today's note if note does not exist", async () => {
    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openTodayNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(1);
    expect(getOpenedFilenames()).toContain(`${getDateInYYYYMMDDFormat()}.md`);
  });
});
