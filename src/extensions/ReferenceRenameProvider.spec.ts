import vscode from 'vscode';

import ReferenceRenameProvider from './ReferenceRenameProvider';
import {
  createFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('ReferenceRenameProvider', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not provide rename for dangling link', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename, '[[nonexistenlink]]');

    const doc = await openTextDocument(filename);

    const referenceRenameProvider = new ReferenceRenameProvider();

    expect(() =>
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).toThrowError();
  });

  it('should provide rename for a link to the existing file', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, `[[${name1}]]`);
    await createFile(`${name1}.md`);

    const doc = await openTextDocument(`${name0}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    expect(referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "character": 2,
          "line": 0,
        },
        Object {
          "character": 7,
          "line": 0,
        },
      ]
    `);
  });

  it('should provide rename edit', async () => {
    const name0 = rndName();
    const name1 = rndName();
    const newLinkName = rndName();

    await createFile(`${name0}.md`, `[[${name1}]]`);
    await createFile(`${name1}.md`);

    const doc = await openTextDocument(`${name0}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    const workspaceEdit = await referenceRenameProvider.provideRenameEdits(
      doc,
      new vscode.Position(0, 2),
      newLinkName,
    );

    expect(workspaceEdit!).not.toBeNull();
  });
});
