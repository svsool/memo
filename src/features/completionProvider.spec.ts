import { window, Position } from 'vscode';

import { provideCompletionItems } from './completionProvider';
import {
  createFile,
  rndName,
  cacheWorkspace,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  updateMemoConfigProperty,
  createSymlink,
} from '../test/testUtils';

describe('provideCompletionItems()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should provide links to notes and images', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;
    const name2 = `c-${rndName()}`;

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`);
    await createFile(`${name2}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual([
      expect.objectContaining({ insertText: name0, label: name0 }),
      expect.objectContaining({ insertText: name1, label: name1 }),
      expect.objectContaining({ insertText: `${name2}.png`, label: `${name2}.png` }),
    ]);
  });

  it('should provide short and long links on name clash', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;
    const name2 = `c-${rndName()}`;

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`);
    await createFile(`/folder1/${name1}.md`);
    await createFile(`/folder1/subfolder1/${name1}.md`);
    await createFile(`${name2}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual([
      expect.objectContaining({ insertText: name0, label: name0 }),
      expect.objectContaining({ insertText: name1, label: name1 }),
      expect.objectContaining({ insertText: `folder1/${name1}`, label: `folder1/${name1}` }),
      expect.objectContaining({
        insertText: `folder1/subfolder1/${name1}`,
        label: `folder1/subfolder1/${name1}`,
      }),
      // images expected to come after notes in autocomplete due to sortPaths logic
      expect.objectContaining({
        insertText: `${name2}.png`,
        label: `${name2}.png`,
      }),
    ]);
  });

  it('should provide links to images and notes on embedding', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;
    const name2 = `c-${rndName()}`;

    await createFile(`${name0}.md`);
    await createFile(`${name1}.png`);
    await createFile(`${name2}.png`);
    await createFile(`/folder1/${name2}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '![['));

    const completionItems = provideCompletionItems(doc, new Position(0, 3));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: `${name1}.png`,
        label: `${name1}.png`,
      }),
      expect.objectContaining({
        insertText: `${name2}.png`,
        label: `${name2}.png`,
      }),
      expect.objectContaining({
        insertText: `folder1/${name2}.png`,
        label: `folder1/${name2}.png`,
      }),
      expect.objectContaining({
        insertText: name0,
        label: name0,
      }),
    ]);
  });

  it('should provide links to images and notes on embedding', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;
    const name2 = `c-${rndName()}`;

    await createFile(`${name0}.md`);
    await createFile(`${name1}.png`);
    await createFile(`${name2}.png`);
    await createFile(`/folder1/${name2}.png`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '![['));

    const completionItems = provideCompletionItems(doc, new Position(0, 3));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: `${name1}.png`,
        label: `${name1}.png`,
      }),
      expect.objectContaining({
        insertText: `${name2}.png`,
        label: `${name2}.png`,
      }),
      expect.objectContaining({
        insertText: `folder1/${name2}.png`,
        label: `folder1/${name2}.png`,
      }),
      expect.objectContaining({
        insertText: name0,
        label: name0,
      }),
    ]);
  });

  it('should provide dangling references', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;

    await createFile(
      `${name0}.md`,
      `
    [[dangling-ref]]
    [[dangling-ref]]
    [[dangling-ref2|Test Label]]
    [[folder1/long-dangling-ref]]
    ![[dangling-ref3]]
    \`[[dangling-ref-within-code-span]]\`
    \`\`\`
    Preceding text
    [[dangling-ref-within-fenced-code-block]]
    Following text
    \`\`\`
    `,
    );
    await createFile(`${name1}.md`);

    const doc = await openTextDocument(`${name1}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '![['));

    const completionItems = provideCompletionItems(doc, new Position(0, 3));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: name0,
        label: name0,
      }),
      expect.objectContaining({
        insertText: name1,
        label: name1,
      }),
      expect.objectContaining({
        insertText: 'dangling-ref',
        label: 'dangling-ref',
      }),
      expect.objectContaining({
        insertText: 'dangling-ref2',
        label: 'dangling-ref2',
      }),
      expect.objectContaining({
        insertText: 'dangling-ref3',
        label: 'dangling-ref3',
      }),
      expect.objectContaining({
        insertText: 'folder1/long-dangling-ref',
        label: 'folder1/long-dangling-ref',
      }),
    ]);
  });

  it('should ignore redundant symlinks', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;

    await createFile(`${name1}.md`);
    await createFile(`${name0}.md`);
    await createSymlink(`/folder1/subfolder1/${name1}.md`, `${name1}.md`);
    await createSymlink(`/folder1/${name1}.md`, `${name1}.md`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: `${name0}`,
        label: `${name0}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `${name1}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `folder1/${name1}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `folder1/subfolder1/${name1}`,
      }),
    ]);
  });

  it('should distinguish symlinks and real files', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;

    await createFile(`${name1}.md`);
    await createFile(`${name0}.md`);
    await createFile(`/folder1/subfolder2/${name1}.md`);
    await createSymlink(`/folder1/subfolder1/${name1}.md`, `${name1}.md`);
    await createSymlink(`/folder1/${name1}.md`, `${name1}.md`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: `${name0}`,
        label: `${name0}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `${name1}`,
      }),
      expect.objectContaining({
        insertText: `folder1/${name1}`,
        label: `folder1/${name1}`,
      }),
      expect.objectContaining({
        insertText: `folder1/subfolder1/${name1}`,
        label: `folder1/subfolder1/${name1}`,
      }),
      expect.objectContaining({
        insertText: `folder1/subfolder2/${name1}`,
        label: `folder1/subfolder2/${name1}`,
      }),
    ]);
  });

  it('should keep aliases', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;
    const name2 = `c-${rndName()}`; // alias

    await createFile(`${name1}.md`);
    await createFile(`${name0}.md`);
    await createSymlink(`/folder1/subfolder2/${name2}.md`, `${name1}.md`);
    await createSymlink(`/folder1/subfolder1/${name2}.md`, `${name1}.md`);
    await createSymlink(`/folder1/subfolder1/${name1}.md`, `${name1}.md`);
    await createSymlink(`/folder1/${name1}.md`, `${name1}.md`);

    await cacheWorkspace();

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

    const completionItems = provideCompletionItems(doc, new Position(0, 2));

    expect(completionItems).toEqual([
      expect.objectContaining({
        insertText: `${name0}`,
        label: `${name0}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `${name1}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `folder1/${name1}`,
      }),
      expect.objectContaining({
        insertText: `${name1}`,
        label: `folder1/subfolder1/${name1}`,
      }),
      expect.objectContaining({
        insertText: `${name2}`,
        label: `folder1/subfolder1/${name2}`,
      }),
      expect.objectContaining({
        insertText: `${name2}`,
        label: `folder1/subfolder2/${name2}`,
      }),
    ]);
  });

  describe('with links.completion.removeRedundantSymlinks = true', () => {
    it('should remove redundant symlinks', async () => {
      const name0 = `a-${rndName()}`;
      const name1 = `b-${rndName()}`;

      await updateMemoConfigProperty('links.completion.removeRedundantSymlinks', true);

      await createFile(`${name1}.md`);
      await createFile(`${name0}.md`);
      await createSymlink(`/folder1/subfolder1/${name1}.md`, `${name1}.md`);
      await createSymlink(`/folder1/${name1}.md`, `${name1}.md`);

      await cacheWorkspace();

      const doc = await openTextDocument(`${name0}.md`);

      const editor = await window.showTextDocument(doc);

      await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

      const completionItems = provideCompletionItems(doc, new Position(0, 2));

      expect(completionItems).toEqual([
        expect.objectContaining({
          insertText: `${name0}`,
          label: `${name0}`,
        }),
        expect.objectContaining({
          insertText: `${name1}`,
          label: `${name1}`,
        }),
      ]);
    });

    it('should remove redundant aliases', async () => {
      const name0 = `a-${rndName()}`;
      const name1 = `b-${rndName()}`;
      const name2 = `c-${rndName()}`; // alias

      await updateMemoConfigProperty('links.completion.removeRedundantSymlinks', true);

      await createFile(`${name1}.md`);
      await createFile(`${name0}.md`);
      await createSymlink(`/folder1/subfolder2/${name2}.md`, `${name1}.md`);
      await createSymlink(`/folder1/subfolder1/${name2}.md`, `${name1}.md`);
      await createSymlink(`/folder1/subfolder1/${name1}.md`, `${name1}.md`);
      await createSymlink(`/folder1/${name1}.md`, `${name1}.md`);

      await cacheWorkspace();

      const doc = await openTextDocument(`${name0}.md`);

      const editor = await window.showTextDocument(doc);

      await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

      const completionItems = provideCompletionItems(doc, new Position(0, 2));

      expect(completionItems).toEqual([
        expect.objectContaining({
          insertText: `${name0}`,
          label: `${name0}`,
        }),
        expect.objectContaining({
          insertText: `${name1}`,
          label: `${name1}`,
        }),
        expect.objectContaining({
          insertText: `${name2}`,
          label: `folder1/subfolder1/${name2}`,
        }),
      ]);
    });
  });

  describe('with links.format = long', () => {
    it('should provide only long links', async () => {
      const name0 = `a-${rndName()}`;
      const name1 = `b-${rndName()}`;

      await updateMemoConfigProperty('links.format', 'long');

      await createFile(`${name0}.md`);
      await createFile(`/folder1/${name1}.md`);
      await createFile(`/folder1/subfolder1/${name1}.md`);

      await cacheWorkspace();

      const doc = await openTextDocument(`${name0}.md`);

      const editor = await window.showTextDocument(doc);

      await editor.edit((edit) => edit.insert(new Position(0, 0), '[['));

      const completionItems = provideCompletionItems(doc, new Position(0, 2));

      expect(completionItems).toEqual([
        expect.objectContaining({ insertText: name0, label: name0 }),
        expect.objectContaining({ insertText: `folder1/${name1}`, label: `folder1/${name1}` }),
        expect.objectContaining({
          insertText: `folder1/subfolder1/${name1}`,
          label: `folder1/subfolder1/${name1}`,
        }),
      ]);
    });
  });
});
