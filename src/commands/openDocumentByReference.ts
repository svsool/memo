import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  containsImageExt,
  getWorkspaceCache,
  findUriByRef,
  ensureDirectoryExists,
  parseRef,
} from '../utils';

const openDocumentByReference = async ({ reference }: { reference: string }) => {
  const { ref } = parseRef(reference);

  const uri = findUriByRef(getWorkspaceCache().allUris, ref);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri);
  } else if (!containsImageExt(reference)) {
    // TODO: Open document regardless of extension
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
      const paths = ref.split('/');
      const pathsWithExt = [...paths.slice(0, -1), `${paths.slice(-1)}.md`];
      const filePath = path.join(workspaceFolder.uri.fsPath, ...pathsWithExt);

      // don't override file content if it already exists
      if (!fs.existsSync(filePath)) {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, '');
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
    }
  }
};

export default openDocumentByReference;
