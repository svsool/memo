import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { cache } from '../workspace';
import {
  findUriByRef,
  ensureDirectoryExists,
  parseRef,
  getWorkspaceFolder,
  getRefWithExt,
  resolveShortRefFolder,
} from '../utils';

let workspaceErrorShown = false;

const openDocumentByReference = async ({
  reference,
  showOption = vscode.ViewColumn.Active,
}: {
  reference: string;
  showOption?: vscode.ViewColumn;
}) => {
  const { ref } = parseRef(reference);

  const uri = findUriByRef(cache.getWorkspaceCache().allUris, ref);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri, showOption);
  } else {
    const workspaceFolder = getWorkspaceFolder()!;
    if (workspaceFolder) {
      const refWithExt = getRefWithExt(ref);
      const shortRefFolder = resolveShortRefFolder(ref);

      const filePath = path.join(
        workspaceFolder,
        ...(shortRefFolder ? [shortRefFolder, refWithExt] : [refWithExt]),
      );

      // don't override file content if it already exists
      if (!fs.existsSync(filePath)) {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, '');
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), showOption);
    } else if (!workspaceErrorShown) {
      workspaceErrorShown = true;

      vscode.window.showErrorMessage(
        `It seems that you are trying to use Memo in single file mode.

        Memo works best in folder/workspace mode.

        The easiest way to start is to create a new folder and drag it onto the VSCode or use File > Open Folder... from the menu bar.
        `,
      );
    }
  }
};

export default openDocumentByReference;
