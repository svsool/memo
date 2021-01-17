import vscode, { commands } from 'vscode';

import { getReferenceAtPosition } from '../utils';

const openReferenceBeside = async () => {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const refAtPos = getReferenceAtPosition(
    activeTextEditor.document,
    activeTextEditor.selection.start,
  );

  if (refAtPos) {
    commands.executeCommand('_memo.openDocumentByReference', {
      reference: refAtPos.ref,
      showOption: vscode.ViewColumn.Beside,
    });
  }
};

export default openReferenceBeside;
