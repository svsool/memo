import { window, workspace, commands, ExtensionContext } from 'vscode';

import { findUriByRef, getReferenceAtPosition, getWorkspaceCache } from '../utils';

export const activate = (context: ExtensionContext) => {
  const updateContext = () => {
    const activeTextEditor = window.activeTextEditor;

    const refResult =
      activeTextEditor &&
      getReferenceAtPosition(activeTextEditor.document, activeTextEditor.selection.start);

    const uri = refResult && findUriByRef(getWorkspaceCache().allUris, refResult.ref);

    commands.executeCommand('setContext', 'memo:cursorAtExistingReference', !!uri);
  };

  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(updateContext),
    window.onDidChangeActiveTextEditor(updateContext),
    workspace.onDidChangeTextDocument(updateContext),
  );
};
