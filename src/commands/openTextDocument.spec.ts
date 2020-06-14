import { commands } from 'vscode';

import {
  createFile,
  rndName,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('openTextDocument command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should open text document', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await commands.executeCommand('_memo.openTextDocument', { reference: name });

    expect(getOpenedFilenames()).toContain(filename);
  });

  it('should create new text document if one does not exist', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await commands.executeCommand('_memo.openTextDocument', { reference: name });

    expect(getOpenedFilenames()).toContain(`${name}.md`);
  });
});
