import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  containsImageExt,
  getWorkspaceCache,
  sortPaths,
  findUriByRef,
  ensureDirectoryExistence,
} from '../utils';

const openDocumentByReference = async ({ reference }: { reference: string }) => {
  const [ref] = reference.split('|');

  const uris = sortPaths([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris], {
    pathKey: 'fsPath',
    shallowFirst: true,
  });

  const uri = findUriByRef(uris, ref);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri);
  } else if (!containsImageExt(reference)) {
    // Create missing file if does not exist yet (there is no way to edit image in VSCode so don't do anything in this case)
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
      const paths = ref.split('/');
      const pathsWithExt = [...paths.slice(0, -1), `${paths.slice(-1)}.md`];
      const filePath = path.join(workspaceFolder.uri.fsPath, ...pathsWithExt);

      // don't override file content if it already exists
      if (!fs.existsSync(filePath)) {
        ensureDirectoryExistence(filePath);
        fs.writeFileSync(filePath, '');
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
    }
  }
};

export default openDocumentByReference;
