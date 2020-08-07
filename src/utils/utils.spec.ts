import { window, Selection, workspace, Range, Position, Uri } from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  createFile,
  rndName,
  cleanWorkspace,
  closeEditorsAndCleanWorkspace,
  openTextDocument,
  toPlainObject,
} from '../test/testUtils';
import {
  containsImageExt,
  containsMarkdownExt,
  containsOtherKnownExts,
  containsUnknownExt,
  fsPathToRef,
  trimLeadingSlash,
  trimTrailingSlash,
  trimSlashes,
  isLongRef,
  normalizeSlashes,
  getWorkspaceFolder,
  getWorkspaceCache,
  getConfigProperty,
  matchAll,
  cacheWorkspace,
  cacheUris,
  cacheRefs,
  addCachedRefs,
  removeCachedRefs,
  cleanWorkspaceCache,
  getRefUriUnderCursor,
  getReferenceAtPosition,
  escapeForRegExp,
  extractEmbedRefs,
  parseRef,
  replaceRefs,
  findReferences,
  getFileUrlForMarkdownPreview,
  getImgUrlForMarkdownPreview,
  isUncPath,
  findFilesByExts,
  findAllUrisWithUnknownExts,
  extractExt,
  findUriByRef,
  ensureDirectoryExists,
  extractDanglingRefs,
  findDanglingRefsByFsPath,
} from './utils';
import * as utils from './utils';

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

describe('containsOtherKnownExts()', () => {
  it('should return true when input contains one of the other known extensions', () => {
    expect(containsOtherKnownExts('/Users/memo/Diary/Notes/note.txt')).toBe(true);
  });

  it('should return false when input does not contain one of the other known extensions', () => {
    expect(containsOtherKnownExts('/Users/memo/Diary/Attachments/image.psd')).toBe(false);
  });
});

describe('containsUnknownExt()', () => {
  it('should return true when input contains unknown extension', () => {
    expect(containsUnknownExt('/Users/memo/Diary/Notes/note.unknown')).toBe(true);
  });

  it('should return false when input does not contain unknown extension', () => {
    expect(containsUnknownExt('/Users/memo/Diary/Attachments/image.md')).toBe(false);
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

describe('trimTrailingSlash()', () => {
  it('should trim trailing slash', () => {
    expect(trimTrailingSlash('/usr/local/bin/')).toBe('/usr/local/bin');
  });

  it('should trim trailing backslash', () => {
    expect(trimTrailingSlash('\\Windows\\System32\\')).toBe('\\Windows\\System32');
  });
});

describe('trimSlashes()', () => {
  it('should trim leading & trailing slashes', () => {
    expect(trimSlashes('/usr/local/bin/')).toBe('usr/local/bin');
  });

  it('should trim leading & trailing backslashes', () => {
    expect(trimSlashes('\\Windows\\System32\\')).toBe('Windows\\System32');
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
    const otherFilename = `${rndName()}.txt`;

    await createFile(
      noteFilename,
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
    [[${imageFilename}]]
    `,
      false,
    );
    await createFile(imageFilename, '', false);
    await createFile(otherFilename, '', false);

    await cacheWorkspace();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);
  });
});

describe('cacheUris()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheUris();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should cache uris', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;
    const otherFilename = `${rndName()}.txt`;

    await createFile(noteFilename, ``, false);
    await createFile(imageFilename, '', false);
    await createFile(otherFilename, '', false);

    await cacheUris();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);
  });
});

describe('cacheRefs()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheRefs();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });

  it('should cache refs', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(
      noteFilename,
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
    [[${imageFilename}]]
    `,
    );
    await createFile(imageFilename);

    await cacheRefs();

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);

    cleanWorkspaceCache();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });
});

describe('addCachedRefs', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail without parameters', () => {
    expect(addCachedRefs([])).resolves.toBeUndefined();
  });

  it('should not fail with non-existing uri', () => {
    expect(addCachedRefs([Uri.file('/unknown')])).resolves.toBeUndefined();
  });

  it('should add cached refs', async () => {
    const name = rndName();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);
  });

  it('should add cached refs on top of existing', async () => {
    const name = rndName();

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);

    await createFile(`${name}.md`, '[[dangling-ref]] [[dangling-ref2]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'dangling-ref2']);
  });
});

describe('removeCachedRefs()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail with non-existing uri', () => {
    expect(() => removeCachedRefs([])).not.toThrow();
  });

  it('should not fail if there is nothing to remove', () => {
    expect(() => removeCachedRefs([Uri.file('/unknown')])).not.toThrow();
  });

  it('should remove cached refs', async () => {
    const name = rndName();

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);

    await removeCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });
});

describe('cleanWorkspaceCache()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cleanWorkspaceCache();

    expect([
      ...getWorkspaceCache().markdownUris,
      ...getWorkspaceCache().imageUris,
      ...getWorkspaceCache().otherUris,
    ]).toHaveLength(0);
  });

  it('should clean workspace cache', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;
    const otherFilename = `${rndName()}.txt`;

    await createFile(
      noteFilename,
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
    [[${imageFilename}]]
    `,
    );
    await createFile(imageFilename);
    await createFile(otherFilename);

    await cacheWorkspace();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);

    cleanWorkspaceCache();

    expect([
      ...getWorkspaceCache().markdownUris,
      ...getWorkspaceCache().imageUris,
      ...getWorkspaceCache().otherUris,
    ]).toHaveLength(0);
    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
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
  it('should return null if nothing to replace', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[some-ref]]',
        }),
      }),
    ).toBe(null);
  });

  it('should replace short ref with short ref', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref]]',
        }),
      }),
    ).toBe('[[new-test-ref]]');
  });

  it('should replace short ref with label with short ref with label', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref|Test Label]]',
        }),
      }),
    ).toBe('[[new-test-ref|Test Label]]');
  });

  it('should replace long ref with long ref', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      }),
    ).toBe('[[folder1/new-test-ref]]');
  });

  it('should replace long ref with long ref', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      }),
    ).toBe('[[folder1/new-test-ref]]');
  });

  it('should replace long ref + label with long ref + label', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref|Test Label]]',
        }),
      }),
    ).toBe('[[folder1/new-test-ref|Test Label]]');
  });

  it('should replace long ref + label with short ref + label', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref|Test Label]]',
        }),
      }),
    ).toBe('[[new-test-ref|Test Label]]');
  });

  it('should replace short ref + label with long ref + label', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'folder1/new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref|Test Label]]',
        }),
      }),
    ).toBe('[[folder1/new-test-ref|Test Label]]');
  });

  it('should replace short ref with short ref with unknown extension', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref', new: 'new-test-ref.unknown' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref]]',
        }),
      }),
    ).toBe('[[new-test-ref.unknown]]');
  });

  it('should replace short ref with unknown extension with short ref ', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'test-ref.unknown', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref.unknown]]',
        }),
      }),
    ).toBe('[[new-test-ref]]');
  });

  it('should replace long ref with short ref with unknown extension', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref', new: 'new-test-ref.unknown' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      }),
    ).toBe('[[new-test-ref.unknown]]');
  });

  it('should replace long ref with unknown extension with short ref ', async () => {
    expect(
      replaceRefs({
        refs: [{ old: 'folder1/test-ref.unknown', new: 'new-test-ref' }],
        document: await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref.unknown]]',
        }),
      }),
    ).toBe('[[new-test-ref]]');
  });

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

describe('isLongRef()', () => {
  it('should return false if ref is short', () => {
    expect(isLongRef('short-ref')).toBe(false);
  });
  it('should return true if ref is long', () => {
    expect(isLongRef('/long/ref')).toBe(true);
  });
});

describe('normalizeSlashes()', () => {
  it('should replace backslashes with forward slashes', () => {
    expect(normalizeSlashes('\\Windows\\System32')).toBe('/Windows/System32');
  });
});

describe('fsPathToRef()', () => {
  it('should transform path to short ref', () => {
    expect(fsPathToRef({ path: path.join('Desktop', 'Diary', 'Note') })).toBe('Note');
  });

  it('should transform path to long ref', () => {
    expect(
      fsPathToRef({ path: path.join('Desktop', 'Diary', 'Note'), basePath: path.join('Desktop') }),
    ).toBe('Diary/Note');
  });

  it('should transform path to long ref', () => {
    expect(
      fsPathToRef({ path: path.join('Desktop', 'Diary', 'Note'), basePath: path.join('Desktop') }),
    ).toBe('Diary/Note');
  });

  it('should preserve extension in short ref', () => {
    expect(
      fsPathToRef({
        path: path.join('Desktop', 'Diary', 'Attachments', 'image.png'),
        keepExt: true,
      }),
    ).toBe('image.png');
  });

  it('should preserve extension in long ref', () => {
    expect(
      fsPathToRef({
        path: path.join('Desktop', 'Diary', 'Attachments', 'image.png'),
        basePath: path.join('Desktop'),
        keepExt: true,
      }),
    ).toBe('Diary/Attachments/image.png');
  });
});

describe('getWorkspaceFolder()', () => {
  it('should return workspace folder', () => {
    expect(getWorkspaceFolder()).not.toBeUndefined();
  });
});

describe('getConfigProperty()', () => {
  it('should return config property', () => {
    expect(getConfigProperty('imagePreviewMaxHeight', null)).toBe('200');
  });

  it('should return default property on getting unknown config property', () => {
    expect(getConfigProperty('unknownProperty', 'default')).toBe('default');
  });
});

describe('matchAll()', () => {
  it('should find all matches', () => {
    expect(
      matchAll(
        new RegExp(`\\[\\[(([^\\[\\]]+?)(\\|.*)?)\\]\\]`, 'gi'),
        `
    [[ref|Test Label]]
    [[ref 2|Test Label 2]]
    `,
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Array [
          "[[ref|Test Label]]",
          "ref|Test Label",
          "ref",
          "|Test Label",
        ],
        Array [
          "[[ref 2|Test Label 2]]",
          "ref 2|Test Label 2",
          "ref 2",
          "|Test Label 2",
        ],
      ]
    `);
  });
});

describe('getReferenceAtPosition()', () => {
  it('should get reference at position for short link', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({ language: 'markdown', content: '[[test]]' }),
        new Position(0, 4),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "label": "",
        "range": Array [
          Object {
            "character": 0,
            "line": 0,
          },
          Object {
            "character": 8,
            "line": 0,
          },
        ],
        "ref": "test",
      }
    `);
  });

  it('should get reference at position for long link', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({ language: 'markdown', content: '[[folder/test]]' }),
        new Position(0, 4),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "label": "",
        "range": Array [
          Object {
            "character": 0,
            "line": 0,
          },
          Object {
            "character": 15,
            "line": 0,
          },
        ],
        "ref": "folder/test",
      }
    `);
  });

  it('should get reference at position for short resource link', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({ language: 'markdown', content: '![[test]]' }),
        new Position(0, 4),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "label": "",
        "range": Array [
          Object {
            "character": 1,
            "line": 0,
          },
          Object {
            "character": 9,
            "line": 0,
          },
        ],
        "ref": "test",
      }
    `);
  });

  it('should get reference at position for long resource link', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({ language: 'markdown', content: '![[folder/test]]' }),
        new Position(0, 4),
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "label": "",
        "range": Array [
          Object {
            "character": 1,
            "line": 0,
          },
          Object {
            "character": 16,
            "line": 0,
          },
        ],
        "ref": "folder/test",
      }
    `);
  });
});

describe('escapeForRegExp()', () => {
  it.each`
    actual  | expected
    ${'.'}  | ${'\\.'}
    ${'|'}  | ${'\\|'}
    ${'*'}  | ${'\\*'}
    ${'+'}  | ${'\\+'}
    ${'?'}  | ${'\\?'}
    ${'^'}  | ${'\\^'}
    ${'$'}  | ${'\\$'}
    ${'{'}  | ${'\\{'}
    ${'}'}  | ${'\\}'}
    ${'('}  | ${'\\('}
    ${')'}  | ${'\\)'}
    ${'['}  | ${'\\['}
    ${']'}  | ${'\\]'}
    ${'\\'} | ${'\\\\'}
  `('should escape $actual symbol for regexp', ({ actual, expected }) => {
    expect(escapeForRegExp(actual)).toBe(expected);
  });
});

describe('extractEmbedRefs()', () => {
  it('should not extract embed refs', () => {
    expect(
      extractEmbedRefs(`
    [[image.png]]
    [[note]]
    [note]
    `),
    ).toHaveLength(0);
  });

  it('should extract embed refs', () => {
    expect(
      extractEmbedRefs(`
    ![[image.png]]
    ![[note]]
    `),
    ).toMatchInlineSnapshot(`
      Array [
        "image.png",
        "note",
      ]
    `);
  });
});

describe('findReferences()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should find references', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(
      `${name0}.md`,
      `[[test]]
    ![[test]]`,
    );
    await createFile(`${name1}.md`, '[[test1]]');

    const refs = await findReferences('test');

    expect(refs).toHaveLength(2);

    expect(toPlainObject(refs)).toMatchObject([
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.stringContaining(`${name0}.md`),
            scheme: 'file',
          },
          range: [
            { line: 0, character: 2 },
            { line: 0, character: 6 },
          ],
        },
        matchText: '[[test]]',
      },
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.stringContaining(`${name0}.md`),
            scheme: 'file',
          },
          range: [
            { line: 1, character: 7 },
            { line: 1, character: 11 },
          ],
        },
        matchText: '[[test]]',
      },
    ]);
  });
});

describe('getFileUrlForMarkdownPreview()', () => {
  it('should get file url for markdown preview', () => {
    expect(getFileUrlForMarkdownPreview('/Users/Memo/Diary/Note.md')).toBe(
      '/Users/Memo/Diary/Note.md',
    );
  });
});

describe('getImgUrlForMarkdownPreview()', () => {
  it('should get img url for markdown preview', () => {
    expect(getImgUrlForMarkdownPreview('/Users/Memo/Diary/image.png')).toBe(
      'vscode-resource://file///Users/Memo/Diary/image.png',
    );
  });
});

describe('isUncPath()', () => {
  it('should return true for UNC path', () => {
    expect(isUncPath('\\\\servername\\path')).toBe(true);
  });

  it('should return false for non-UNC path', () => {
    expect(isUncPath('/servername/path')).toBe(false);
  });
});

describe('findFilesByExts()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not find anything with empty exts param', async () => {
    expect(await findFilesByExts([])).toHaveLength(0);
  });

  it('should find files by exts', async () => {
    const name0 = rndName();
    const name1 = rndName();
    const name2 = rndName();

    await createFile(`a-${name0}.md`);
    await createFile(`b-${name1}.png`);
    await createFile(`${name2}.psd`);

    expect(
      toPlainObject(
        (await findFilesByExts(['md', 'png'])).sort((a, b) => a.fsPath.localeCompare(b.fsPath)),
      ),
    ).toMatchObject([
      {
        $mid: 1,
        path: expect.stringContaining(`a-${name0}.md`),
        scheme: 'file',
      },
      {
        $mid: 1,
        path: expect.stringContaining(`b-${name1}.png`),
        scheme: 'file',
      },
    ]);
  });
});

describe('findAllUrisWithUnknownExts()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should find no uris when none provided', async () => {
    const name0 = rndName();

    await createFile(`${name0}.txt`);
    await createFile(`${name0}.md`);
    await createFile(`${name0}.png`);
    await createFile(`${name0}.psd`);
    await createFile(`${name0}.html`);

    expect(await findAllUrisWithUnknownExts([])).toHaveLength(0);
  });

  it('should find all uris with unknown exts', async () => {
    const name0 = rndName();

    await createFile(`${name0}.txt`);
    await createFile(`${name0}.md`);
    await createFile(`${name0}.png`);
    await createFile(`${name0}.psd`);
    await createFile(`${name0}.html`);

    expect(
      toPlainObject(
        (
          await findAllUrisWithUnknownExts([
            Uri.file(path.join(getWorkspaceFolder()!, `${name0}.txt`)),
            Uri.file(path.join(getWorkspaceFolder()!, `${name0}.md`)),
            Uri.file(path.join(getWorkspaceFolder()!, `${name0}.png`)),
            Uri.file(path.join(getWorkspaceFolder()!, `${name0}.psd`)),
            Uri.file(path.join(getWorkspaceFolder()!, `${name0}.html`)),
          ])
        ).sort((a, b) => a.fsPath.localeCompare(b.fsPath)),
      ),
    ).toMatchObject([
      {
        $mid: 1,
        path: expect.stringContaining(`${name0}.html`),
        scheme: 'file',
      },
      {
        $mid: 1,
        path: expect.stringContaining(`${name0}.psd`),
        scheme: 'file',
      },
    ]);
  });
});

describe('extractExt()', () => {
  it('should not extract ext for dot file', () => {
    expect(extractExt('/Users/Memo/Diary/.vscode')).toBe('');
  });

  it('should extract ext', () => {
    expect(extractExt('/Users/Memo/Diary/Note.md')).toBe('md');
  });

  it('should extract ext 2', () => {
    expect(extractExt('C:\\Users\\Memo\\Desktop\\Diary\\image.png')).toBe('png');
  });
});

describe('findUriByRef()', () => {
  it('should find markdown uri by short ref', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
          ],
          'File',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.md'),
        path: expect.stringContaining('File.md'),
        scheme: 'file',
      }),
    );
  });

  it('should find image uri by short ref', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
          ],
          'File.png',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.png'),
        path: expect.stringContaining('File.png'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri by long ref', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
          ],
          'Memo/Diary/File',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.md'),
        path: expect.stringContaining('File.md'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri by long image ref', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
          ],
          'Memo/Diary/File.png',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.png'),
        path: expect.stringContaining('File.png'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri by ref regardless of the case', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
          ],
          'memo/diary/file',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.md'),
        path: expect.stringContaining('File.md'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri by ref even if contains unknown ext', async () => {
    expect(
      toPlainObject(
        await findUriByRef(
          [
            Uri.file('/Users/Memo/Diary/File.txt'),
            Uri.file('/Users/Memo/Diary/File.md'),
            Uri.file('/Users/Memo/Diary/File.png'),
            Uri.file('/Users/Memo/Diary/File.unknown'),
          ],
          'memo/diary/file.unknown',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.stringContaining('File.unknown'),
        path: expect.stringContaining('File.unknown'),
        scheme: 'file',
      }),
    );
  });

  it('should match long refs against workspace root', async () => {
    const getWorkspaceFolderMock = jest.spyOn(utils, 'getWorkspaceFolder');
    getWorkspaceFolderMock.mockReturnValue('/Users/Memo/Test');

    expect(
      await findUriByRef([Uri.file('/Users/Memo/Test/hello.md')], 'Test/hello'),
    ).toBeUndefined();

    getWorkspaceFolderMock.mockRestore();
  });
});

describe('ensureDirectoryExists()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should create all necessary directories', () => {
    const dirPath = path.join(getWorkspaceFolder()!, 'folder1', 'folder2');
    expect(fs.existsSync(dirPath)).toBe(false);
    ensureDirectoryExists(path.join(dirPath, 'file.md'));
    expect(fs.existsSync(dirPath)).toBe(true);
  });
});

describe('extractDanglingRefs()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should extract dangling refs', async () => {
    const name0 = rndName();

    await createFile(`${name0}.md`);

    expect(
      extractDanglingRefs(
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
    [[${name0}]]
    `,
      ),
    ).toEqual(['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3']);
  });
});

describe('findDanglingRefsByFsPath()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should find dangling refs by fs path', async () => {
    const name0 = rndName();
    const name1 = rndName();

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
    [[${name1}]]
    `,
    );
    await createFile(`${name1}.md`);

    const refsByFsPath = await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris);

    expect(Object.keys(refsByFsPath)).toHaveLength(1);
    expect(Object.values(refsByFsPath)[0]).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'folder1/long-dangling-ref',
      'dangling-ref3',
    ]);
  });

  it('should find dangling refs from the just edited document', async () => {
    const name0 = rndName();

    await createFile(`${name0}.md`, '[[dangling-ref]]');

    const doc = await openTextDocument(`${name0}.md`);

    const editor = await window.showTextDocument(doc);

    const refsByFsPath = await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris);

    expect(Object.keys(refsByFsPath)).toHaveLength(1);
    expect(Object.values(refsByFsPath)[0]).toEqual(['dangling-ref']);

    await editor.edit((edit) => edit.insert(new Position(1, 0), '[[dangling-ref2]]'));

    const refsByFsPath2 = await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris);

    expect(Object.keys(refsByFsPath2)).toHaveLength(1);
    expect(Object.values(refsByFsPath2)[0]).toEqual(['dangling-ref', 'dangling-ref2']);

    await editor.edit((edit) => edit.delete(new Range(new Position(0, 0), new Position(2, 0))));

    expect(await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris)).toEqual({});
  });
});
