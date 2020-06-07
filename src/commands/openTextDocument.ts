import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { getMarkdownPaths, getImagePaths } from '../fsCache';
import { containsImageExt } from '../util';

const openTextDocument = ({ reference }: { reference: string }) => {
  const uris = [...getMarkdownPaths(), ...getImagePaths()];

  const uri = uris.find((uri) => uri.fsPath.toLowerCase().includes(reference.toLowerCase()));

  if (uri) {
    vscode.commands.executeCommand('vscode.open', uri);
  } else if (!containsImageExt(reference)) {
    // Create missing file
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
      const filePath = path.join(workspaceFolder.uri.fsPath, `${reference}.md`);
      fs.writeFileSync(filePath, '');
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
    }
  }
};

export default openTextDocument;
