import { window, workspace } from 'vscode';
import fs from 'fs';

import {
  lineBreakOffsetsByLineIndex,
  positionToOffset,
  isInFencedCodeBlock,
  isInCodeSpan,
  isMdEditor,
  isFileTooLarge,
  cleanFileSizesCache,
} from './externalUtils';
import {
  closeEditorsAndCleanWorkspace,
  createFile,
  openTextDocument,
  rndName,
} from '../test/testUtils';

describe('lineBreakOffsetsByLineIndex()', () => {
  it('should return offset for a single empty line', () => {
    expect(lineBreakOffsetsByLineIndex('')).toEqual([1]);
  });

  it('should return offset for multiline string', () => {
    expect(lineBreakOffsetsByLineIndex('test\r\ntest\rtest\ntest')).toEqual([6, 16, 21]);
  });
});

describe('positionToOffset()', () => {
  it('should through with illegal arguments', () => {
    expect(() => positionToOffset('', { line: -1, column: 0 })).toThrowError();
    expect(() => positionToOffset('', { line: 0, column: -1 })).toThrowError();
  });

  it('should transform position to offset', () => {
    expect(positionToOffset('', { line: 0, column: 0 })).toEqual(0);
    expect(positionToOffset('test\r\ntest\rtest\ntest', { line: 1, column: 0 })).toEqual(6);
    expect(positionToOffset('test\r\ntest\rtest\ntest', { line: 2, column: 0 })).toEqual(16);
  });

  it('should handle line and column overflow properly', () => {
    expect(positionToOffset('', { line: 10, column: 10 })).toEqual(0);
  });
});

describe('isInFencedCodeBlock()', () => {
  it('should return false when within outside of fenced code block', async () => {
    expect(isInFencedCodeBlock('\n```Fenced code block```', 0)).toBe(false);
  });

  it('should return true when within fenced code block', async () => {
    expect(isInFencedCodeBlock(`\n\`\`\`\nFenced code block\n\`\`\``, 2)).toBe(true);
  });
});

describe('isInCodeSpan()', () => {
  it('should return false when outside of code span', async () => {
    expect(isInCodeSpan(' `test`', 0, 0)).toBe(false);
  });

  it('should return true when within code span', async () => {
    expect(isInCodeSpan('`test`', 0, 1)).toBe(true);
  });

  it('should return true when within code span on the next line', async () => {
    expect(isInCodeSpan('\n`test`', 1, 1)).toBe(true);
  });
});

describe('isMdEditor()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should return false when editor is not markdown', async () => {
    const doc = await workspace.openTextDocument({ language: 'html', content: '' });
    const editor = await window.showTextDocument(doc);

    expect(isMdEditor(editor)).toBe(false);
  });

  it('should return true when editor is for markdown', async () => {
    const doc = await workspace.openTextDocument({ language: 'markdown', content: '' });
    const editor = await window.showTextDocument(doc);

    expect(isMdEditor(editor)).toBe(true);
  });
});

describe('isFileTooLarge()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should return false when editor language other than markdown', async () => {
    const doc = await workspace.openTextDocument({ language: 'html', content: '' });
    const editor = await window.showTextDocument(doc);

    expect(isMdEditor(editor)).toBe(false);
  });

  it('should return true when editor language is markdown', async () => {
    const doc = await workspace.openTextDocument({ language: 'markdown', content: '' });
    const editor = await window.showTextDocument(doc);

    expect(isMdEditor(editor)).toBe(true);
  });
});

describe('isFileTooLarge()', () => {
  beforeEach(async () => {
    await closeEditorsAndCleanWorkspace();
    cleanFileSizesCache();
  });

  afterEach(async () => {
    await closeEditorsAndCleanWorkspace();
    cleanFileSizesCache();
  });

  it('should return false if file does not exist', async () => {
    const doc = await workspace.openTextDocument({ content: '' });
    expect(isFileTooLarge(doc)).toBe(false);
  });

  it('should not call statSync and use cached file size', async () => {
    const name = rndName();

    await createFile(`${name}.md`, 'test');

    const doc = await openTextDocument(`${name}.md`);

    const fsStatSyncSpy = jest.spyOn(fs, 'statSync');

    isFileTooLarge(doc, 100);

    expect(fsStatSyncSpy).toBeCalledTimes(1);

    fsStatSyncSpy.mockClear();

    isFileTooLarge(doc, 100);

    expect(fsStatSyncSpy).not.toBeCalled();

    fsStatSyncSpy.mockRestore();
  });

  it('should return false when file is not too large', async () => {
    const name = rndName();

    await createFile(`${name}.md`, 'test');

    const doc = await openTextDocument(`${name}.md`);

    expect(isFileTooLarge(doc, 100)).toBe(false);
  });

  it('should return true when file is too large', async () => {
    const name = rndName();

    await createFile(`${name}.md`, 'test'.repeat(10));

    const doc = await openTextDocument(`${name}.md`);

    expect(isFileTooLarge(doc, 35)).toBe(true);
  });
});
