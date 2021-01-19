import { commands, window, Selection, ViewColumn } from 'vscode';
import path from 'path';
import { debug } from 'console';

import openReferenceBeside from './openReferenceBeside';
import {
  closeEditorsAndCleanWorkspace,
  createFile,
  getWorkspaceFolder,
  openTextDocument,
  rndName,
  toPlainObject,
} from '../test/testUtils';

describe('openReferenceBeside command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);
  afterEach(closeEditorsAndCleanWorkspace);

  it('should call open command-line tool when editor selection is within the reference', async () => {
    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    const name0 = rndName();
    const name1 = rndName();
    console.log('name0=', name0, 'name1=', name1);

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `[[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 2, 0, 2);

    await openReferenceBeside();
    console.log(
      '*****',
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    );

    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([
      [
        'vscode.open',
        expect.objectContaining({
          $mid: 1,
          path: expect.toEndWith(`${name0}.md`),
          scheme: 'file',
        }),
        -2, // ViewColumn.Beside
      ],
    ]);

    // expect(open).toHaveBeenCalledWith(path.join(getWorkspaceFolder()!, `${name0}.md`));

    executeCommandSpy.mockRestore();
  });

  it('should NOT call open command-line tool when editor selection is outside of the reference', async () => {
    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    const name0 = rndName();
    const name1 = rndName();
    console.log('name0=', name0, 'name1=', name1);

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `  [[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 0, 0, 0);

    await openReferenceBeside();

    console.log(
      '*****',
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    );
    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([]);

    executeCommandSpy.mockRestore();
  });
});
