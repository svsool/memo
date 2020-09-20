import vscode, { Position, window, workspace } from 'vscode';

import ReferenceRenameProvider from './ReferenceRenameProvider';
import {
  createFile,
  fileExists,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('ReferenceRenameProvider', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not provide rename for dangling link', async () => {
    const docName = `${rndName()}.md`;

    await createFile(docName, '[[nonexistenlink]]');

    const doc = await openTextDocument(docName);

    const referenceRenameProvider = new ReferenceRenameProvider();

    await expect(
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).rejects.toThrow('Rename is not available for nonexistent links.');
  });

  it('should not provide rename for file with unsaved changes', async () => {
    const docName = `${rndName()}.md`;

    await createFile(docName, '[[nonexistenlink]]');

    const doc = await openTextDocument(docName);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 5), 'test'));

    const referenceRenameProvider = new ReferenceRenameProvider();

    await expect(
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).rejects.toThrow('Rename is not available for unsaved files.');
  });

  it('should not provide rename for multiline link', async () => {
    const docName = `${rndName()}.md`;

    await createFile(docName, '[[nonexisten\nlink]]');

    const doc = await openTextDocument(docName);

    const referenceRenameProvider = new ReferenceRenameProvider();

    await expect(
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).rejects.toThrow('Rename is not available.');
  });

  it('should provide rename for a link to the existing file', async () => {
    const docName = rndName();
    const existingName = rndName();

    await createFile(`${docName}.md`, `[[${existingName}]]`);
    await createFile(`${existingName}.md`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    expect(await referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)))
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

  it('should provide rename for a link to the existing file with an unknown extension', async () => {
    const docName = rndName();
    const existingFilenameWithUnknownExt = `${rndName()}.unknown`;

    await createFile(`${docName}.md`, `[[${existingFilenameWithUnknownExt}]]`);
    await createFile(existingFilenameWithUnknownExt);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    expect(await referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "character": 2,
          "line": 0,
        },
        Object {
          "character": 15,
          "line": 0,
        },
      ]
    `);
  });

  it('should provide rename edit and apply it to workspace', async () => {
    const docName = rndName();
    const actualName = rndName();
    const nextName = rndName();

    await createFile(`${docName}.md`, `[[${actualName}]]`);
    await createFile(`${actualName}.md`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    const workspaceEdit = await referenceRenameProvider.provideRenameEdits(
      doc,
      new vscode.Position(0, 2),
      nextName,
    );

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.md`)).toBe(true);

    await workspace.applyEdit(workspaceEdit);

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.md`)).toBe(false);
    expect(fileExists(`${nextName}.md`)).toBe(true);
  });

  it('should provide rename edit for a link to the existing file with unknown extension', async () => {
    const docName = rndName();
    const actualName = rndName();
    const nextName = rndName();

    await createFile(`${docName}.md`, `[[${actualName}.unknown]]`);
    await createFile(`${actualName}.unknown`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    const workspaceEdit = await referenceRenameProvider.provideRenameEdits(
      doc,
      new vscode.Position(0, 2),
      nextName,
    );

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.unknown`)).toBe(true);

    await workspace.applyEdit(workspaceEdit);

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.unknown`)).toBe(false);
    expect(fileExists(`${nextName}.md`)).toBe(true);
  });

  it('should provide rename for markdown file with a dot in the filename', async () => {
    const docName = rndName();
    const actualName = rndName();
    const nextNameWithDot = `${rndName()} v1.0 release`;

    await createFile(`${docName}.md`, `[[${actualName}]]`);
    await createFile(`${actualName}.md`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    const workspaceEdit = await referenceRenameProvider.provideRenameEdits(
      doc,
      new vscode.Position(0, 2),
      nextNameWithDot,
    );

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.md`)).toBe(true);

    await workspace.applyEdit(workspaceEdit);

    expect(fileExists(`${docName}.md`)).toBe(true);
    expect(fileExists(`${actualName}.md`)).toBe(false);
    expect(fileExists(`${nextNameWithDot}.md`)).toBe(true);
  });

  it('should not provide rename for a link within code span', async () => {
    const docName = rndName();
    const someLink = rndName();

    await createFile(`${docName}.md`, `\`[[${someLink}]]\``);
    await createFile(`${someLink}.md`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    await expect(
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).rejects.toThrow('Rename is not available.');
  });

  it('should not provide rename for a link within fenced code block', async () => {
    const docName = rndName();
    const someLink = rndName();

    await createFile(
      `${docName}.md`,
      `
    \`\`\`
    Preceding text
    [[${someLink}]]
    Following text
    \`\`\`
    `,
    );
    await createFile(`${someLink}.md`);

    const doc = await openTextDocument(`${docName}.md`);

    const referenceRenameProvider = new ReferenceRenameProvider();

    await expect(
      referenceRenameProvider.prepareRename(doc, new vscode.Position(0, 2)),
    ).rejects.toThrow('Rename is not available.');
  });
});
