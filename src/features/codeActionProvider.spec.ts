import vscode from 'vscode';

import codeActionProvider from './codeActionProvider';
import { rndName, createFile, openTextDocument } from '../test/testUtils';

describe('codeActionProvider', () => {
  it('should provide code actions', async () => {
    const name0 = rndName();

    await createFile(`${name0}.md`, 'Hello world!');

    const doc = await openTextDocument(`${name0}.md`);
    const range = new vscode.Range(0, 0, 0, 12);

    expect(
      codeActionProvider.provideCodeActions(doc, range, undefined as any, undefined as any),
    ).toEqual([
      {
        title: 'Extract range to a new note',
        command: 'memo.extractRangeToNewNote',
        arguments: [doc, range],
      },
    ]);
  });
});
