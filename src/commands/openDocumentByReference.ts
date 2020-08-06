import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  getWorkspaceCache,
  findUriByRef,
  ensureDirectoryExists,
  parseRef,
  getWorkspaceFolder,
} from '../utils';

const openDocumentByReference = async ({ reference }: { reference: string }) => {
  const { ref } = parseRef(reference);

  const uri = findUriByRef(getWorkspaceCache().allUris, ref);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri);
  } else {
    const workspaceFolder = getWorkspaceFolder()!;
    if (workspaceFolder) {
      const paths = ref.split('/');
      const refExt = path.parse(ref).ext;
      const pathsWithExt = [
        ...paths.slice(0, -1),
        `${paths.slice(-1)}${refExt !== '.md' && refExt !== '' ? '' : '.md'}`,
      ];
      const filePath = path.join(workspaceFolder, ...pathsWithExt);

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
