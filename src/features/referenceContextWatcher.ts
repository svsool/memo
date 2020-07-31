import { window, workspace, commands, ExtensionContext } from 'vscode';

import { getRefUriUnderCursor } from '../utils';

const updateRefExistsContext = () =>
  commands.executeCommand('setContext', 'memo:refUnderCursorExists', !!getRefUriUnderCursor());

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(updateRefExistsContext),
    window.onDidChangeActiveTextEditor(updateRefExistsContext),
    workspace.onDidChangeTextDocument(updateRefExistsContext),
  );
};
