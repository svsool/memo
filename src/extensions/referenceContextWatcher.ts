import { window, workspace, commands, ExtensionContext } from 'vscode';

import { getRefUriUnderCursor } from '../utils';

const updateReferenceContext = () =>
  commands.executeCommand('setContext', 'memo:cursorAtExistingReference', !!getRefUriUnderCursor());

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(updateReferenceContext),
    window.onDidChangeActiveTextEditor(updateReferenceContext),
    workspace.onDidChangeTextDocument(updateReferenceContext),
  );
};
