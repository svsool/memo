import { ExtensionContext } from 'vscode';

import * as referenceContextWatcher from './referenceContextWatcher';
import { closeEditorsAndCleanWorkspace } from '../test/testUtils';

describe('referenceContextWatcher feature', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail on activate', () => {
    expect(() => {
      const mockContext = { subscriptions: [] } as unknown as ExtensionContext;
      referenceContextWatcher.activate(mockContext);
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
      mockContext.subscriptions.forEach((sub) => sub.dispose());
    }).not.toThrow();
  });
});
