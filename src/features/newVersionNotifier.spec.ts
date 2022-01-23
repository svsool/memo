import { ExtensionContext } from 'vscode';
import path from 'path';

import * as newVersionNotifier from './newVersionNotifier';
import { closeEditorsAndCleanWorkspace } from '../test/utils';

describe('newVersionNotifier feature', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail on activate', () => {
    expect(() => {
      const mockContext = {
        subscriptions: [],
        extensionPath: path.resolve(path.join(__dirname, '..', '..')),
      } as unknown as ExtensionContext;
      newVersionNotifier.activate(mockContext);
      mockContext.subscriptions.forEach((sub) => sub.dispose());
    }).not.toThrow();
  });
});
