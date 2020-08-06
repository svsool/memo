import * as vscode from 'vscode';

import { closeEditorsAndCleanWorkspace } from './test/testUtils';

const MEMO_EXTENSION_ID = 'svsool.markdown-memo';

describe('extension', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

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

  it('should have extension active on load', () => {
    const memoExtension = vscode.extensions.all.find(
      (extension) => extension.id === MEMO_EXTENSION_ID,
    );
    expect(memoExtension!.isActive).toBe(true);
  });
});
