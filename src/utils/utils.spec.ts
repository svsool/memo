import { Position, Range, Selection, Uri, window, workspace } from 'vscode';
import fs from 'fs';
import path from 'path';

import * as utils from './utils';
import {
  containsImageExt,
  containsMarkdownExt,
  containsOtherKnownExts,
  containsUnknownExt,
  ensureDirectoryExists,
  escapeForRegExp,
  extractDanglingRefs,
  extractEmbedRefs,
  extractExt,
  findAllUrisWithUnknownExts,
  findDanglingRefsByFsPath,
  findFilesByExts,
  findNonIgnoredFiles,
  findReferences,
  findUriByRef,
  fsPathToRef,
  getConfigProperty,
  getFileUrlForMarkdownPreview,
  getImgUrlForMarkdownPreview,
  getMemoConfigProperty,
  getReferenceAtPosition,
  getRefUriUnderCursor,
  getWorkspaceFolder,
  isLongRef,
  isUncPath,
  matchAll,
  normalizeSlashes,
  parseRef,
  trimLeadingSlash,
  trimSlashes,
  trimTrailingSlash,
  getDirRelativeToWorkspace,
  extractRefsFromText,
} from './utils';
import { cache } from '../workspace';
import {
  closeEditorsAndCleanWorkspace,
  createFile,
  openTextDocument,
  rndName,
  toPlainObject,
  updateConfigProperty,
} from '../test/utils';

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
    expect(() => parseRef(undefined as unknown as string)).toThrow();
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

  it('should ignore escape symbol', () => {
    expect(parseRef('link\\|Label')).toEqual({ ref: 'link', label: 'Label' });
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

describe('getMemoConfigProperty()', () => {
  it('should return config property', () => {
    expect(getMemoConfigProperty('links.preview.imageMaxHeight', null)).toBe('200');
  });

  it('should return default property on getting unknown config property', () => {
    expect(getMemoConfigProperty('unknownProperty' as any, 'default' as any)).toBe('default');
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

  it('should get reference at position for a short link with dots', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({
          language: 'markdown',
          content: '![[test-v1.1.0]]',
        }),
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
        "ref": "test-v1.1.0",
      }
    `);
  });

  it('should get reference at position for a long link with dots', async () => {
    expect(
      getReferenceAtPosition(
        await workspace.openTextDocument({
          language: 'markdown',
          content: '![[test/test-v1.1.0]]',
        }),
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
            "character": 21,
            "line": 0,
          },
        ],
        "ref": "test/test-v1.1.0",
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
            path: expect.toEndWith(`${name0}.md`),
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
            path: expect.toEndWith(`${name0}.md`),
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

  it('should find multiple references', async () => {
    const name = `note-${rndName()}`;

    await createFile(
      `${name}.md`,
      `[[test1]]
    ![[nested-folder/test]]
    [[nested-folder/test-2]]
    [[test1-1]]`,
    );

    const refs = await findReferences(['test1', 'nested-folder/test']);

    expect(refs).toHaveLength(2);

    expect(toPlainObject(refs)).toMatchObject([
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.toEndWith(`${name}.md`),
            scheme: 'file',
          },
          range: [
            { line: 0, character: 2 },
            { line: 0, character: 7 },
          ],
        },
        matchText: '[[test1]]',
      },
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.toEndWith(`${name}.md`),
            scheme: 'file',
          },
          range: [
            { line: 1, character: 7 },
            { line: 1, character: 25 },
          ],
        },
        matchText: '[[nested-folder/test]]',
      },
    ]);
  });

  it('should find references bypassing excluded paths', async () => {
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${name0}.md`, '[[test]]');
    await createFile(`${name1}.md`, '[[test1]]');

    const refs = await findReferences('test', [path.join(getWorkspaceFolder()!, `${name1}.md`)]);

    expect(refs).toHaveLength(1);

    expect(toPlainObject(refs)).toMatchObject([
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.toEndWith(`${name0}.md`),
            scheme: 'file',
          },
          range: [
            { line: 0, character: 2 },
            { line: 0, character: 6 },
          ],
        },
        matchText: '[[test]]',
      },
    ]);
  });

  it('should detect position properly for the first reference', async () => {
    const name = rndName();

    await createFile(
      `${name}.md`,
      '[[README|Start here]] or refer to any other [[Note]]. Use (cmd or ctrl) + click on the [[Note]] to create a new note to the disk on the fly.',
    );

    const refs = await findReferences('README');

    expect(refs).toHaveLength(1);

    expect(toPlainObject(refs)).toMatchObject([
      {
        location: {
          uri: {
            $mid: 1,
            path: expect.stringContaining(`${name}.md`),
            scheme: 'file',
          },
          range: [
            { line: 0, character: 2 },
            { line: 0, character: 19 },
          ],
        },
        matchText:
          '[[README|Start here]] or refer to any other [[Note]]. Use (cmd or ctrl) + click on the [[Note]] to create a new note to the disk on the fly.',
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
      '/Users/Memo/Diary/image.png',
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
        path: expect.toEndWith(`a-${name0}.md`),
        scheme: 'file',
      },
      {
        $mid: 1,
        path: expect.toEndWith(`b-${name1}.png`),
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
        path: expect.toEndWith(`${name0}.html`),
        scheme: 'file',
      },
      {
        $mid: 1,
        path: expect.toEndWith(`${name0}.psd`),
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
        fsPath: expect.toEndWith('File.md'),
        path: expect.toEndWith('File.md'),
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
        fsPath: expect.toEndWith('File.png'),
        path: expect.toEndWith('File.png'),
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
        fsPath: expect.toEndWith('File.md'),
        path: expect.toEndWith('File.md'),
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
        fsPath: expect.toEndWith('File.png'),
        path: expect.toEndWith('File.png'),
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
        fsPath: expect.toEndWith('File.md'),
        path: expect.toEndWith('File.md'),
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
        fsPath: expect.toEndWith('File.unknown'),
        path: expect.toEndWith('File.unknown'),
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

  it('should find uri by ref with explicit markdown extension in ref', async () => {
    expect(
      toPlainObject(await findUriByRef([Uri.file('/Users/Memo/Diary/File.md.md')], 'File.md')),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.toEndWith('File.md.md'),
        path: expect.toEndWith('File.md.md'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri from a ref with unknown extension', async () => {
    expect(
      toPlainObject(await findUriByRef([Uri.file('/Users/Memo/Diary/File.any.md')], 'File.any')),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.toEndWith('File.any.md'),
        path: expect.toEndWith('File.any.md'),
        scheme: 'file',
      }),
    );
  });

  it('should not find a dot file', async () => {
    expect(
      toPlainObject(await findUriByRef([Uri.file('/Users/Memo/Diary/.md')], '.md')),
    ).toBeUndefined();
  });

  it('should find uri by ref for a short link with dots', async () => {
    expect(
      toPlainObject(
        await findUriByRef([Uri.file('/Users/Memo/Diary/test/test-v1.1.0.md')], 'test-v1.1.0'),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.toEndWith('test-v1.1.0.md'),
        path: expect.toEndWith('test-v1.1.0.md'),
        scheme: 'file',
      }),
    );
  });

  it('should find uri by ref for a long link with dots', async () => {
    expect(
      toPlainObject(
        await findUriByRef([Uri.file('/Users/Memo/Diary/test/test-v1.1.0.md')], 'test/test-v1.1.0'),
      ),
    ).toEqual(
      expect.objectContaining({
        $mid: 1,
        fsPath: expect.toEndWith('test-v1.1.0.md'),
        path: expect.toEndWith('test-v1.1.0.md'),
        scheme: 'file',
      }),
    );
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

    const refsByFsPath = await findDanglingRefsByFsPath(cache.getWorkspaceCache().markdownUris);

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

    const refsByFsPath = await findDanglingRefsByFsPath(cache.getWorkspaceCache().markdownUris);

    expect(Object.keys(refsByFsPath)).toHaveLength(1);
    expect(Object.values(refsByFsPath)[0]).toEqual(['dangling-ref']);

    await editor.edit((edit) => edit.insert(new Position(1, 0), '[[dangling-ref2]]'));

    const refsByFsPath2 = await findDanglingRefsByFsPath(cache.getWorkspaceCache().markdownUris);

    expect(Object.keys(refsByFsPath2)).toHaveLength(1);
    expect(Object.values(refsByFsPath2)[0]).toEqual(['dangling-ref', 'dangling-ref2']);

    await editor.edit((edit) => edit.delete(new Range(new Position(0, 0), new Position(2, 0))));

    expect(await findDanglingRefsByFsPath(cache.getWorkspaceCache().markdownUris)).toEqual({});
  });
});

describe('findNonIgnoredFiles()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should find non-ignored files', async () => {
    const prevConfig = getConfigProperty('search.exclude', {});
    await updateConfigProperty('search.exclude', { '**/search-ignored': true });

    const allowedName = rndName();
    const ignoredName = rndName();

    await createFile(`${allowedName}.md`);
    await createFile(`search-ignored/some-package/${ignoredName}.md`);

    const files = await findNonIgnoredFiles('**/*.md');

    expect(files).toHaveLength(1);
    expect(path.basename(files[0].fsPath)).toBe(`${allowedName}.md`);

    await updateConfigProperty('search.exclude', prevConfig);
  });

  describe('when exclude param passed explicitly', () => {
    it('should find non-ignored files', async () => {
      const allowedName = rndName();
      const ignoredName = rndName();

      await createFile(`${allowedName}.md`);
      await createFile(`search-ignored/some-package/${ignoredName}.md`);

      const files = await findNonIgnoredFiles('**/*.md', '**/search-ignored');

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].fsPath)).toBe(`${allowedName}.md`);
    });
  });

  describe('when config includes py files', () => {
    it('should find non-ignored files', async () => {
      const prevConfig = getConfigProperty('memo.links.extensions.other', []);
      await updateConfigProperty('memo.links.extensions.other', ['py']);
      const allowedName = rndName();

      await createFile(`${allowedName}.py`);

      const files = await findNonIgnoredFiles('**/*.py');

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].fsPath)).toBe(`${allowedName}.py`);

      await updateConfigProperty('memo.links.extensions.other', prevConfig);
    });
  });

  describe('when exclude param passed explicitly and search.exclude set', () => {
    it('should find non-ignored files', async () => {
      const prevConfig = getConfigProperty('search.exclude', {});
      await updateConfigProperty('search.exclude', { '**/search-ignored': true });

      const allowedName = rndName();
      const ignoredName = rndName();

      await createFile(`${allowedName}.md`);
      await createFile(`search-ignored/some-package/${ignoredName}.md`);
      await createFile(`search-ignored-2/some-package/${ignoredName}.md`);

      const files = await findNonIgnoredFiles('**/*.md', '**/search-ignored-2');

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].fsPath)).toBe(`${allowedName}.md`);

      await updateConfigProperty('search.exclude', prevConfig);
    });
  });
});

describe('getDirRelativeToWorkspace()', () => {
  it('should get directory relative to workspace', async () => {
    const dir1 = rndName();
    const dir2 = rndName();
    const name1 = rndName();

    const uri = await createFile(`/${dir1}/${dir2}/${name1}.md`);

    expect(getDirRelativeToWorkspace(uri)).toBe(path.join('/', dir1, dir2));
  });
});

describe('extractRefsFromText()', () => {
  const refRegExp = new RegExp('\\[\\[([^\\[\\]]+?)\\]\\]', 'g');

  it('should extract ref from text', () => {
    const text = `
      [[hello-world]] [[adjacent-ref]]

      [[any-ref]]
    `;
    expect(extractRefsFromText('hello-world', text)).toMatchInlineSnapshot(`
      Array [
        Object {
          "line": Object {
            "trailingText": "[[hello-world]] [[adjacent-ref]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 19,
                "line": 1,
              },
              "start": Object {
                "character": 8,
                "line": 1,
              },
            },
            "text": "hello-world",
          },
        },
      ]
    `);
  });

  it('should extract refs from text', () => {
    const text = `
      [[hello-world]] [[adjacent-ref]] [[new-world]]

      [[any-ref]]
    `;

    expect(extractRefsFromText(['hello-world', 'new-world'], text)).toMatchInlineSnapshot(`
      Array [
        Object {
          "line": Object {
            "trailingText": "[[hello-world]] [[adjacent-ref]] [[new-world]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 19,
                "line": 1,
              },
              "start": Object {
                "character": 8,
                "line": 1,
              },
            },
            "text": "hello-world",
          },
        },
        Object {
          "line": Object {
            "trailingText": "[[new-world]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 50,
                "line": 1,
              },
              "start": Object {
                "character": 41,
                "line": 1,
              },
            },
            "text": "new-world",
          },
        },
      ]
    `);
  });

  it('should not extract empty refs', () => {
    const text = 'leading text [[]] trailing text';

    expect(extractRefsFromText(refRegExp, text)).toHaveLength(0);
  });

  it('should not extract refs within fenced block', () => {
    const text = `
      \`\`\`
      Preceding text
      [[some-ref]]
      Following text
      \`\`\`
    `;

    expect(extractRefsFromText(refRegExp, text)).toHaveLength(0);
  });

  it('should not extract refs within code span', () => {
    expect(extractRefsFromText('test-ref', '`[[test-ref]]`')).toHaveLength(0);
  });

  it('should extract refs from text using RegExp', () => {
    const text = `
      [[hello-world]] [[test-ref]]

      some text here...

      [[any-ref]]
    `;

    expect(extractRefsFromText(refRegExp, text)).toMatchInlineSnapshot(`
      Array [
        Object {
          "line": Object {
            "trailingText": "[[hello-world]] [[test-ref]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 19,
                "line": 1,
              },
              "start": Object {
                "character": 8,
                "line": 1,
              },
            },
            "text": "hello-world",
          },
        },
        Object {
          "line": Object {
            "trailingText": "[[test-ref]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 32,
                "line": 1,
              },
              "start": Object {
                "character": 24,
                "line": 1,
              },
            },
            "text": "test-ref",
          },
        },
        Object {
          "line": Object {
            "trailingText": "[[any-ref]]",
          },
          "ref": Object {
            "position": Object {
              "end": Object {
                "character": 15,
                "line": 5,
              },
              "start": Object {
                "character": 8,
                "line": 5,
              },
            },
            "text": "any-ref",
          },
        },
      ]
    `);
  });
});
