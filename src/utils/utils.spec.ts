import { window, Selection, workspace } from 'vscode';
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
  fsPathToRef,
  trimLeadingSlash,
  getWorkspaceCache,
  cacheWorkspace,
  cleanWorkspaceCache,
  getRefUriUnderCursor,
  parseRef,
  replaceRefs,
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

describe('fsPathToRef()', () => {
  it('should return short ref', () => {
    expect(fsPathToRef({ path: '/Users/memo/Diary/Notes/note.md' })).toEqual('note');
  });

  it('should return short ref with extension', () => {
    expect(fsPathToRef({ path: '/Users/memo/Diary/Attachments/image.png', keepExt: true })).toEqual(
      'image.png',
    );
  });

  it('should omit arbitrary extension from short ref', () => {
    expect(fsPathToRef({ path: '/Users/memo/Diary/Notes/note.any-extension' })).toEqual('note');
  });

  it('should return short ref for arbitrary extension', () => {
    expect(
      fsPathToRef({ path: '/Users/memo/Diary/Notes/note.any-extension', keepExt: true }),
    ).toEqual('note.any-extension');
  });

  describe('with basePath', () => {
    it('should return long ref', () => {
      expect(
        fsPathToRef({ path: '/Users/memo/Diary/Notes/note.md', basePath: '/Users/memo' }),
      ).toEqual('Diary/Notes/note');
    });

    it('should return long ref with extension', () => {
      expect(
        fsPathToRef({
          path: '/Users/memo/Diary/Attachments/image.png',
          basePath: '/Users/memo',
          keepExt: true,
        }),
      ).toEqual('Diary/Attachments/image.png');
    });

    it('should omit arbitrary extension from long ref', () => {
      expect(
        fsPathToRef({
          path: '/Users/memo/Diary/Notes/note.any-extension',
          basePath: '/Users/memo',
        }),
      ).toEqual('Diary/Notes/note');
    });

    it('should return long ref for arbitrary extension', () => {
      expect(
        fsPathToRef({
          path: '/Users/memo/Diary/Notes/note.any-extension',
          basePath: '/Users/memo',
          keepExt: true,
        }),
      ).toEqual('Diary/Notes/note.any-extension');
    });
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

describe('getRefUriUnderCursor()', () => {
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

describe('parseRef()', () => {
  it('should fail on providing wrong parameter type', () => {
    expect(() => parseRef((undefined as unknown) as string)).toThrow();
  });

  it('should return empty ref and label', () => {
    expect(parseRef('')).toEqual({ ref: '', label: '' });
  });

  it('should parse raw ref and return ref and label', () => {
    expect(parseRef('link|Label')).toEqual({ ref: 'link', label: 'Label' });
  });

  it('should favour only first divider', () => {
    expect(parseRef('link|||Label')).toEqual({ ref: 'link', label: '||Label' });
  });
});

describe('replaceRefs()', () => {
  it('should not replace ref within code span', async () => {
    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: '`[[test-ref]]`',
    });

    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: doc,
      }),
    ).toBe('`[[test-ref]]`');
  });

  it('should not replace ref within code span 2', async () => {
    const content = `
    Preceding text
    \`[[test-ref]]\`
    Following text
    `;
    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: content,
    });

    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: doc,
      }),
    ).toBe(content);
  });

  it('should not replace ref within fenced code block', async () => {
    const initialContent = `
    \`\`\`
    Preceding text
    [[test-ref]]
    Following text
    \`\`\`
    `;

    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: initialContent,
    });

    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: doc,
      }),
    ).toBe(initialContent);
  });
});
