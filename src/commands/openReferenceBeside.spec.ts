import { commands, window, Selection, ViewColumn } from 'vscode';

import openReferenceBeside from './openReferenceBeside';
import {
  closeEditorsAndCleanWorkspace,
  createFile,
  openTextDocument,
  rndName,
  toPlainObject,
  waitForExpect,
} from '../test/testUtils';

describe('openReferenceBeside command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);
  afterEach(closeEditorsAndCleanWorkspace);

  it('should execute vscode.open when editor selection is within the reference', async () => {
    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `[[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 2, 0, 2);

    await openReferenceBeside();

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
        ViewColumn.Beside,
      ],
    ]);

    executeCommandSpy.mockRestore();
  });

  it('should NOT execute vscode.open when editor selection is outside of the reference', async () => {
    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `  [[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 0, 0, 0);

    await openReferenceBeside();

    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([]);

    executeCommandSpy.mockRestore();
  });

  it('should increase the viewColumn# of active editor after opening a reference to the side', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `[[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 2, 0, 2);

    expect(window.activeTextEditor === editor).toBeTrue();
    expect(window.activeTextEditor!.viewColumn === ViewColumn.One).toBeTrue();

    await openReferenceBeside();

    await waitForExpect(() => expect(window.visibleTextEditors.length === 2).toBeTrue());
    expect(window.activeTextEditor!.viewColumn === ViewColumn.Two).toBeTrue();
  });
});
