import { commands, workspace } from 'vscode';
import fs from 'fs';

import { getWorkspaceCache } from '../utils';

const openRandomNote = async () => {
  const openedFileNames = workspace.textDocuments.map((d) => d.fileName);
  const markdownUris = getWorkspaceCache().markdownUris.filter(
    ({ fsPath }) => !openedFileNames.includes(fsPath),
  );
  const randomUriIndex = Math.floor(Math.random() * markdownUris.length);
  const randomUri = markdownUris[randomUriIndex];

  if (randomUri && fs.existsSync(randomUri.fsPath)) {
    await commands.executeCommand('vscode.open', randomUri, { preview: false });
  }
};

export default openRandomNote;
