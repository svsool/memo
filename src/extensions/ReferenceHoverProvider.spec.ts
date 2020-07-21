import vscode from 'vscode';
import path from 'path';

import ReferenceHoverProvider from './ReferenceHoverProvider';
import {
  createFile,
  rndName,
  getWorkspaceFolder,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  toPlainObject,
} from '../test/testUtils';

describe('ReferenceHoverProvider', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not return anything for empty document', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename);

    const doc = await openTextDocument(filename);

    const referenceHoverProvider = new ReferenceHoverProvider();

    expect(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 0))).toBeNull();
  });

  it('should provide hover for note', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, `[[${name1}]]`);
    await createFile(`${name1}.md`, '# Hello world');

    const doc = await openTextDocument(`${name0}.md`);

    const referenceHoverProvider = new ReferenceHoverProvider();

    expect(
      toPlainObject(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 4))),
    ).toEqual({
      contents: ['# Hello world'],
      range: [
        { character: expect.any(Number), line: 0 },
        { character: expect.any(Number), line: 0 },
      ],
    });
  });

  it('should provide hover for image', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, `![[${name1}.png]]`);
    await createFile(`${name1}.png`);

    const doc = await openTextDocument(`${name0}.md`);

    const referenceHoverProvider = new ReferenceHoverProvider();

    const imagePath = `${path.join(getWorkspaceFolder()!, name1)}.png`;

    expect(
      toPlainObject(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 4))),
    ).toEqual({
      contents: [`![](${vscode.Uri.file(imagePath).toString()}|height=200)`],
      range: [
        { character: expect.any(Number), line: 0 },
        { character: expect.any(Number), line: 0 },
      ],
    });
  });

  it('should provide hover for a note instead of an image on filenames clash', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, `[[${name1}]]`);
    await createFile(`/a/${name1}.png`);
    await createFile(`/b/${name1}.md`, '# Hello world');

    const doc = await openTextDocument(`${name0}.md`);

    const referenceHoverProvider = new ReferenceHoverProvider();

    expect(
      toPlainObject(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 4))),
    ).toEqual({
      contents: ['# Hello world'],
      range: [
        { character: expect.any(Number), line: 0 },
        { character: expect.any(Number), line: 0 },
      ],
    });
  });

  it('should not provide hover for a link within code span', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, `\`[[${name1}]]\``);
    await createFile(`/b/${name1}.md`, '# Hello world');

    const doc = await openTextDocument(`${name0}.md`);

    const referenceHoverProvider = new ReferenceHoverProvider();

    expect(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 4))).toBeNull();
  });

  it('should not provide hover for a link within fenced code block', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(
      `${name0}.md`,
      `
    \`\`\`
    Preceding text
    [[${name1}]]
    Following text
    \`\`\`
    `,
    );
    await createFile(`/b/${name1}.md`, '# Hello world');

    const doc = await openTextDocument(`${name0}.md`);

    const referenceHoverProvider = new ReferenceHoverProvider();

    expect(referenceHoverProvider.provideHover(doc, new vscode.Position(0, 4))).toBeNull();
  });
});
