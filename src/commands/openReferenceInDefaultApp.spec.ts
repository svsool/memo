import { window, Selection } from 'vscode';
import open from 'open';
import path from 'path';

import openReferenceInDefaultApp from './openReferenceInDefaultApp';
import {
  createFile,
  rndName,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
  getWorkspaceFolder,
} from '../test/testUtils';

describe('openReferenceInDefaultApp command', () => {
  beforeEach(async () => {
    await closeEditorsAndCleanWorkspace();
    ((open as unknown) as jest.Mock).mockClear();
  });

  afterEach(async () => {
    await closeEditorsAndCleanWorkspace();
    ((open as unknown) as jest.Mock).mockClear();
  });

  it('should call open command-line tool when editor selection is within the reference', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `[[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 2, 0, 2);

    await openReferenceInDefaultApp();

    expect(open).toHaveBeenCalledWith(path.join(getWorkspaceFolder()!, `${name0}.md`));
  });

  it('should call open command-line tool when editor selection is outside of the reference', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `  [[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 0, 0, 0);

    await openReferenceInDefaultApp();

    expect(open).not.toBeCalled();
  });
});
