import { commands } from 'vscode';
import fs from 'fs';

import { getYesterdayDateInYYYYMMDDFormat, getTodayDateInYYYYMMDDFormat } from '../utils';
import {
  createFile,
  getWorkspaceFolder,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
} from '../test/testUtils';

describe('openYesterdayNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);
  it('should create a different file for yesterday', async () => {
    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openTodayNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(1);
    expect(getOpenedFilenames()).toContain(`${getTodayDateInYYYYMMDDFormat()}.md`);

    await commands.executeCommand('memo.openYesterdayNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(2);
    expect(getOpenedFilenames()).toContain(`${getYesterdayDateInYYYYMMDDFormat()}.md`);
  });
  it("should open yesterday's note if note already exists", async () => {
    const filename = `${getYesterdayDateInYYYYMMDDFormat()}.md`;

    await createFile(filename, '# Hello world');

    await commands.executeCommand('memo.openYesterdayNote');

    expect(getOpenedFilenames()).toContain(filename);

    const doc = await openTextDocument(filename);

    expect(doc.getText()).toBe('# Hello world');
  });

  it("should open yesterday's note if note does not exist", async () => {
    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openYesterdayNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(1);
    expect(getOpenedFilenames()).toContain(`${getYesterdayDateInYYYYMMDDFormat()}.md`);
  });
});
