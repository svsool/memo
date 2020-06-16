import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { containsImageExt, getWorkspaceCache } from '../utils';

const openDocumentByReference = async ({ reference }: { reference: string }) => {
  const [ref] = reference.split('|');

  const uris = [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris];

  const uri = uris.find((uri) => uri.fsPath.toLowerCase().includes(ref.toLowerCase()));

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri);
  } else if (!containsImageExt(reference)) {
    // Create missing file
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
      const filePath = path.join(workspaceFolder.uri.fsPath, `${ref}.md`);
      fs.writeFileSync(filePath, '');
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
    }
  }
};

export default openDocumentByReference;
