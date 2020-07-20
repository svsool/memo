import { window, Selection } from 'vscode';
import path from 'path';

import {
  createFile,
  rndName,
  cleanWorkspace,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
} from '../test/testUtils';
import {
  containsImageExt,
  containsMarkdownExt,
  extractLongRef,
  extractShortRef,
  trimLeadingSlash,
  getWorkspaceCache,
  cacheWorkspace,
  cleanWorkspaceCache,
  getRefUriUnderCursor,
} from './utils';

describe('containsImageExt()', () => {
  test.each(['png', 'jpg', 'jpeg', 'gif'])(
    'should return true when input contains .%s image extension',
    (imgExt) => {
      expect(containsImageExt(`/Users/memo/Diary/Attachments/image.${imgExt}`)).toBe(true);
    },
  );

  it('should return false when input does not contain image extension', () => {
    expect(containsImageExt('/Users/memo/Diary/Notes/note.md')).toBe(false);
  });
});

describe('containsMarkdownExt()', () => {
  it('should return true when input contains markdown extension', () => {
    expect(containsMarkdownExt('/Users/memo/Diary/Notes/note.md')).toBe(true);
  });

  it('should return false when input does not contain markdown extension', () => {
    expect(containsMarkdownExt('/Users/memo/Diary/Attachments/image.png')).toBe(false);
  });
});

describe('trimLeadingSlash()', () => {
  it('should trim leading slash', () => {
    expect(trimLeadingSlash('/usr/local/bin')).toBe('usr/local/bin');
  });

  it('should trim leading backslash', () => {
    expect(trimLeadingSlash('\\Windows\\System32')).toBe('Windows\\System32');
  });
});

describe('extractLongRef()', () => {
  it('should extract long ref', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Notes/note.md')).toEqual({
      label: '',
      ref: 'Diary/Notes/note',
    });
  });

  it('should extract long ref with extension', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Attachments/image.png', true)).toEqual({
      label: '',
      ref: 'Diary/Attachments/image.png',
    });
  });

  it('should extract long ref with label', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Notes/note.md|Test Label')).toEqual({
      label: 'Test Label',
      ref: 'Diary/Notes/note',
    });
  });

  it('should return null if input contains unknown extension', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Notes/website.psd')).toBeNull();
  });
});

describe('extractShortRef()', () => {
  it('should extract short ref', () => {
    expect(extractShortRef('/Users/memo/Diary/Notes/note.md')).toEqual({
      label: '',
      ref: 'note',
    });
  });

  it('should extract short ref with extension', () => {
    expect(extractShortRef('/Users/memo/Diary/Attachments/image.png', true)).toEqual({
      label: '',
      ref: 'image.png',
    });
  });

  it('should extract short ref with label', () => {
    expect(extractShortRef('/Users/memo/Diary/Notes/note.md|Test Label')).toEqual({
      label: 'Test Label',
      ref: 'note',
    });
  });

  it('should return null if input contains unknown extension', () => {
    expect(extractShortRef('/Users/memo/Diary/Notes/website.psd')).toBeNull();
  });
});

describe('cacheWorkspace()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheWorkspace();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should cache workspace', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(noteFilename);
    await createFile(imageFilename);

    await cacheWorkspace();

    expect(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toEqual([noteFilename, imageFilename]);
  });
});

describe('cleanWorkspaceCache()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should clean workspace cache', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(noteFilename);
    await createFile(imageFilename);

    await cacheWorkspace();

    expect(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toEqual([noteFilename, imageFilename]);

    cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });
});

describe('getWorkspaceCache()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', () => {
    cleanWorkspace();
    cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should get workspace cache', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(noteFilename);
    await createFile(imageFilename);

    await cacheWorkspace();

    const uris = [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris];

    expect(uris).toHaveLength(2);
    expect(uris.map(({ fsPath }) => path.basename(fsPath))).toEqual([noteFilename, imageFilename]);
  });
});

describe.only('getRefUriUnderCursor()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should return reference uri under cursor', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `[[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 2, 0, 2);

    expect(getRefUriUnderCursor()!.fsPath).toContain(`${name0}.md`);
  });

  it('should not return reference uri under cursor', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`);
    await createFile(`${name1}.md`, `  [[${name0}]]`);

    const doc = await openTextDocument(`${name1}.md`);
    const editor = await window.showTextDocument(doc);

    editor.selection = new Selection(0, 0, 0, 0);

    expect(getRefUriUnderCursor()).toBeNull();
  });
});
