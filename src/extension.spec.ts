import * as vscode from 'vscode';

import { closeAllEditors } from './test/utils';

const MEMO_EXTENSION_ID = 'memo.markdown-memo';

describe('extension', () => {
  beforeEach(async () => {
    await closeAllEditors();
  });

  it('should find extension in extensions list', () => {
    expect(vscode.extensions.all.some((extension) => extension.id === MEMO_EXTENSION_ID)).toBe(
      true,
    );
  });

  it('should not find not existing extension', () => {
    expect(
      vscode.extensions.all.some((extension) => {
        return extension.id === 'memo.any-extension';
      }),
    ).toBe(false);
  });

  it.skip('should have extension inactive on load', () => {
    const memoExtension = vscode.extensions.all.find(
      (extension) => extension.id === MEMO_EXTENSION_ID,
    );
    expect(memoExtension!.isActive).toBe(false);
  });

  it.skip('should activate extension on calling activate', async () => {
    const memoExtension = vscode.extensions.all.find(
      (extension) => extension.id === MEMO_EXTENSION_ID,
    );
    expect(memoExtension!.isActive).toBe(false);
    await memoExtension!.activate();
    expect(memoExtension!.isActive).toBe(true);
  });
});
