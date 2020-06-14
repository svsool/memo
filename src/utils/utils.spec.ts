import path from 'path';

import { cleanWorkspace, createFile } from '../test/utils';
import {
  containsImageExt,
  containsMarkdownExt,
  extractLongRef,
  extractShortRef,
  trimLeadingSlash,
  getWorkspaceCache,
  cacheWorkspace,
  cleanWorkspaceCache,
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
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Notes/note.md')).toBe(
      'Diary/Notes/note',
    );
  });

  it('should extract long ref with extension', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Attachments/image.png', true)).toBe(
      'Diary/Attachments/image.png',
    );
  });

  it('should return null if input contains unknown extension', () => {
    expect(extractLongRef('/Users/memo', '/Users/memo/Diary/Notes/website.psd')).toBeNull();
  });
});

describe('extractShortRef()', () => {
  it('should extract short ref', () => {
    expect(extractShortRef('/Users/memo/Diary/Notes/note.md')).toBe('note');
  });

  it('should extract short ref with extension', () => {
    expect(extractShortRef('/Users/memo/Diary/Attachments/image.png', true)).toBe('image.png');
  });

  it('should return null if input contains unknown extension', () => {
    expect(extractShortRef('/Users/memo/Diary/Notes/website.psd')).toBeNull();
  });
});

describe('cacheWorkspace()', () => {
  afterEach(() => {
    cleanWorkspace();
    cleanWorkspaceCache();
  });

  it('should work with empty workspace', async () => {
    await cacheWorkspace();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should cache workspace', async () => {
    await createFile('memo-note.md', '# Hello world');
    await createFile('image.png', '👍');

    await cacheWorkspace();

    expect(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toEqual(['memo-note.md', 'image.png']);
  });
});

describe('cleanWorkspaceCache()', () => {
  afterEach(() => {
    cleanWorkspace();
    cleanWorkspaceCache();
  });

  it('should work with empty workspace', async () => {
    await cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should clean workspace cache', async () => {
    await createFile('memo-note.md', '# Hello world');
    await createFile('image.png', '👍');

    await cacheWorkspace();

    expect(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toEqual(['memo-note.md', 'image.png']);

    cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });
});

describe('getWorkspaceCache()', () => {
  afterEach(() => {
    cleanWorkspace();
    cleanWorkspaceCache();
  });

  it('should work with empty workspace', () => {
    cleanWorkspace();
    cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should get workspace cache', async () => {
    await createFile('memo-note.md', '# Hello world');
    await createFile('image.png', '👍');

    await cacheWorkspace();

    const uris = [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris];

    expect(uris).toHaveLength(2);
    expect(uris.map(({ fsPath }) => path.basename(fsPath))).toEqual(['memo-note.md', 'image.png']);
  });
});
