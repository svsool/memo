import { window, workspace, commands, ExtensionContext } from 'vscode';

import { getRefUriUnderCursor, getRefUnderCursor, getReferenceAtPosition } from '../utils';

const updateRefExistsContext = () => {
  commands.executeCommand('setContext', 'memo:refUnderCursorExists', !!getRefUriUnderCursor());
  commands.executeCommand('setContext', 'memo:refFocusedOrHovered', !!getRefUnderCursor());
};

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(updateRefExistsContext),
    window.onDidChangeActiveTextEditor(updateRefExistsContext),
    workspace.onDidChangeTextDocument(updateRefExistsContext),
  );
};
