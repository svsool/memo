import path from 'path';

import { cleanWorkspace, createFile } from '../test/utils';
import {
  containsImageExt,
  containsMarkdownExt,
  extractLongRef,
  extractShortRef,
  trimLeadingSlash,
  getMarkdownUris,
  getImageUris,
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

describe('getMarkdownUris()', () => {
  afterEach(() => {
    cleanWorkspace();
  });

  it('should work with empty workspace', async () => {
    expect(await getMarkdownUris()).toHaveLength(0);
  });

  it('should get markdown uris', async () => {
    await createFile('memo-note.md', '# Hello world');
    await createFile('memo-note-1.md', '# Bye world');

    expect((await getMarkdownUris()).map(({ fsPath }) => path.basename(fsPath))).toEqual(
      expect.arrayContaining(['memo-note.md', 'memo-note-1.md']),
    );
  });
});

describe('getImageUris()', () => {
  afterEach(() => {
    cleanWorkspace();
  });

  it('should work with empty workspace', async () => {
    expect(await getImageUris()).toHaveLength(0);
  });

  it('should get image uris', async () => {
    await createFile('image.png', '👍');
    await createFile('image-1.png', '✌️');

    expect((await getImageUris()).map(({ fsPath }) => path.basename(fsPath))).toEqual(
      expect.arrayContaining(['image.png', 'image-1.png']),
    );
  });
});
