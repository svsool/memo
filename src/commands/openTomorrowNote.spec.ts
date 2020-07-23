import { commands } from 'vscode';
import fs from 'fs';

import { getTomorrowDateInYYYYMMDDFormat, getTodayDateInYYYYMMDDFormat } from '../utils';
import {
  createFile,
  getWorkspaceFolder,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
} from '../test/testUtils';

describe('openTomorrowNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);
  it('should create a different file for tomorrow', async () => {
    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openTodayNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(1);
    expect(getOpenedFilenames()).toContain(`${getTodayDateInYYYYMMDDFormat()}.md`);

    await commands.executeCommand('memo.openTomorrowNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(2);
    expect(getOpenedFilenames()).toContain(`${getTomorrowDateInYYYYMMDDFormat()}.md`);
  });
  it("should open tomorrow's note if note already exists", async () => {
    const filename = `${getTomorrowDateInYYYYMMDDFormat()}.md`;

    await createFile(filename, '# Hello world');

    await commands.executeCommand('memo.openTomorrowNote');

    expect(getOpenedFilenames()).toContain(filename);

    const doc = await openTextDocument(filename);

    expect(doc.getText()).toBe('# Hello world');
  });

  it("should open tomorrow's note if note does not exist", async () => {
    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(0);

    await commands.executeCommand('memo.openTomorrowNote');

    expect(await fs.readdirSync(getWorkspaceFolder()!)).toHaveLength(1);
    expect(getOpenedFilenames()).toContain(`${getTomorrowDateInYYYYMMDDFormat()}.md`);
  });
});
