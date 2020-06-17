import { window, Position } from 'vscode';

import { provideCompletionItems } from './completionProvider';
import {
  createFile,
  rndName,
  cacheWorkspace,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('provideCompletionItems()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should provide completion items', async () => {
    const name0 = rndName();
    const name1 = rndName();
    const name2 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`);
    await createFile(`${name2}.md`);
    await createFile(`${rndName()}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ insertText: name1, label: name1 }),
        expect.objectContaining({ insertText: name2, label: name2 }),
      ]),
    );
  });

  it('should provide short and long links on filename clash', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`);
    await createFile(`/folder1/${name1}.md`);
    await createFile(`/folder1/subfolder1/${name1}.md`);
    await createFile(`${rndName()}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ insertText: name1, label: name1 }),
        expect.objectContaining({ insertText: `folder1/${name1}`, label: `folder1/${name1}` }),
      ]),
    );
  });
});
