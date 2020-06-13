import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { getMarkdownUris, getImageUris, containsImageExt } from '../utils';

const openTextDocument = async ({ reference }: { reference: string }) => {
  const markdownUris = await getMarkdownUris();
  const imageUris = await getImageUris();
  const uris = [...markdownUris, ...imageUris];

  const uri = uris.find((uri) => uri.fsPath.toLowerCase().includes(reference.toLowerCase()));

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri);
  } else if (!containsImageExt(reference)) {
    // Create missing file
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
      const filePath = path.join(workspaceFolder.uri.fsPath, `${reference}.md`);
      fs.writeFileSync(filePath, '');
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
    }
  }
};

export default openTextDocument;
