import open from 'open';
import * as vscode from 'vscode';

import { getWorkspaceCache, getReferenceAtPosition, findUriByRef } from '../utils';

const openReferenceInDefaultApp = async () => {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (activeTextEditor) {
    const refResult = getReferenceAtPosition(
      activeTextEditor.document,
      activeTextEditor.selection.start,
    );

    if (refResult) {
      const uri = findUriByRef(getWorkspaceCache().allUris, refResult.ref);

      if (uri) {
        open(uri.fsPath);
      } else {
        vscode.window.showWarningMessage(
          'Linked file does not exist yet. Try to create a new one by clicking on the link.',
        );
      }
    }
  }
};

export default openReferenceInDefaultApp;
