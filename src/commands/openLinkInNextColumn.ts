import vscode, { commands } from 'vscode';

import { getReferenceAtPosition } from '../utils';

const openLinkInNextColumn = async () => {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const refObj = getReferenceAtPosition(
    activeTextEditor.document,
    activeTextEditor.selection.start,
  );

  if (refObj && refObj.ref) {
    commands.executeCommand('_memo.openDocumentByReference', {
      reference: refObj.ref,
      showOption: vscode.ViewColumn.Beside,
    });
  }
};

export default openLinkInNextColumn;
