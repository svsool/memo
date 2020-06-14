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
    const filename0 = rndName();
    const filename1 = rndName();
    const filename2 = rndName();

    await createFile(`${filename0}.md`);
    await createFile(`${filename1}.md`);
    await createFile(`${filename2}.md`);
    await createFile(`${rndName()}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${filename0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ insertText: filename1, label: filename1 }),
        expect.objectContaining({ insertText: filename2, label: filename2 }),
      ]),
    );
  });
});
