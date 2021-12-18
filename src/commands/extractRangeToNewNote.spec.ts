import vscode, { window } from 'vscode';
import path from 'path';

import extractRangeToNewNote from './extractRangeToNewNote';
import { getWorkspaceFolder } from '../utils';
import {
  closeEditorsAndCleanWorkspace,
  rndName,
  createFile,
  openTextDocument,
} from '../test/testUtils';

describe('extractRangeToNewNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should extract range to a new note', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, 'Hello world.');

    const doc = await openTextDocument(`${name0}.md`);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    targetPathInputBoxSpy.mockReturnValue(
      Promise.resolve(path.join(getWorkspaceFolder()!, `${name1}.md`)),
    );

    await extractRangeToNewNote(doc, new vscode.Range(0, 0, 0, 12));

    expect(await doc.getText()).toBe('');

    const newDoc = await openTextDocument(`${name1}.md`);

    expect(await newDoc.getText()).toBe('Hello world.');

    targetPathInputBoxSpy.mockRestore();
  });

  it('should extract a multiline range to a new note', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(
      `${name0}.md`,
      `Multiline
    Hello world.`,
    );

    const doc = await openTextDocument(`${name0}.md`);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    targetPathInputBoxSpy.mockReturnValue(
      Promise.resolve(path.join(getWorkspaceFolder()!, `${name1}.md`)),
    );

    await extractRangeToNewNote(doc, new vscode.Range(0, 0, 1, 16));

    expect(await doc.getText()).toBe('');

    const newDoc = await openTextDocument(`${name1}.md`);

    expect(await newDoc.getText()).toMatchInlineSnapshot(`
      "Multiline
          Hello world."
    `);

    targetPathInputBoxSpy.mockRestore();
  });

  it('should extract range from active markdown file', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, 'Hello world.');

    const doc = await openTextDocument(`${name0}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new vscode.Selection(0, 0, 0, 12);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    targetPathInputBoxSpy.mockReturnValue(
      Promise.resolve(path.join(getWorkspaceFolder()!, `${name1}.md`)),
    );

    await extractRangeToNewNote();

    expect(await doc.getText()).toBe('');

    const newDoc = await openTextDocument(`${name1}.md`);

    expect(await newDoc.getText()).toBe('Hello world.');

    targetPathInputBoxSpy.mockRestore();
  });

  it('should not extract anything from unknown file format', async () => {
    const name0 = rndName();

    await createFile(`${name0}.txt`, 'Hello world.');

    const doc = await openTextDocument(`${name0}.txt`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new vscode.Selection(0, 0, 0, 12);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    await extractRangeToNewNote();

    expect(await doc.getText()).toBe('Hello world.');

    expect(targetPathInputBoxSpy).not.toBeCalled();

    targetPathInputBoxSpy.mockRestore();
  });

  it('should fail when target path is outside of the workspace', async () => {
    const name0 = rndName();

    await createFile(`${name0}.md`, 'Hello world.');

    const doc = await openTextDocument(`${name0}.md`);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    targetPathInputBoxSpy.mockReturnValue(Promise.resolve('/random-path/file.md'));

    expect(extractRangeToNewNote(doc, new vscode.Range(0, 0, 0, 12))).rejects.toThrowError(
      'should be within the current workspace',
    );

    targetPathInputBoxSpy.mockRestore();
  });

  it('should fail when entered file already exists', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, 'Hello world.');
    await createFile(`${name1}.md`);

    const doc = await openTextDocument(`${name0}.md`);

    const targetPathInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox');

    targetPathInputBoxSpy.mockReturnValue(
      Promise.resolve(path.join(getWorkspaceFolder()!, `${name1}.md`)),
    );

    expect(extractRangeToNewNote(doc, new vscode.Range(0, 0, 0, 12))).rejects.toThrowError(
      'Such file or directory already exists. Please use unique filename instead.',
    );

    targetPathInputBoxSpy.mockRestore();
  });
});
