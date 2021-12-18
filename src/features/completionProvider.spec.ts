import { window, Position, CompletionItem, CompletionItemKind, MarkdownString, Uri } from 'vscode';

import {
  MemoCompletionItem,
  provideCompletionItems,
  resolveCompletionItem,
} from './completionProvider';
import {
  createFile,
  rndName,
  cacheWorkspace,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  updateMemoConfigProperty,
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

  it('should provide sorted links', async () => {
    const name0 = `a-${rndName()}`;
    const name1 = `b-${rndName()}`;

    await createFile(`/folder1/subfolder1/${name1}.md`);
    await createFile(`/folder1/${name1}.md`);
    await createFile(`${name1}.md`);
    await createFile(`${name0}.md`);

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

describe('resolveCompletionItem()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should add documentation for a markdown completion item', async () => {
    const noteName = `note-${rndName()}`;

    const noteUri = await createFile(`${noteName}.md`, 'Test documentation');

    const completionItem: MemoCompletionItem = new CompletionItem(
      noteName,
      CompletionItemKind.File,
    );

    completionItem.fsPath = noteUri!.fsPath;

    expect(
      ((await resolveCompletionItem(completionItem)).documentation as MarkdownString).value,
    ).toBe('Test documentation');
  });

  it('should add documentation for an image completion item', async () => {
    const imageName = `image-${rndName()}`;

    const imageUri = await createFile(`${imageName}.png`);

    const completionItem: MemoCompletionItem = new CompletionItem(
      imageName,
      CompletionItemKind.File,
    );

    completionItem.fsPath = imageUri!.fsPath;

    expect(
      ((await resolveCompletionItem(completionItem)).documentation as MarkdownString).value,
    ).toBe(`![](${Uri.file(completionItem.fsPath).toString()})`);
  });
});
