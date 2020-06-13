import { commands, workspace } from 'vscode';
import fs from 'fs';

import { getMarkdownUris } from '../utils';

const openRandomNote = async () => {
  const openedFileNames = workspace.textDocuments.map((d) => d.fileName);
  const markdownUris = (await getMarkdownUris()).filter(
    ({ fsPath }) => !openedFileNames.includes(fsPath),
  );
  const randomUriIndex = Math.floor(Math.random() * markdownUris.length);
  const randomUri = markdownUris[randomUriIndex];

  if (randomUri && fs.existsSync(randomUri.fsPath)) {
    await commands.executeCommand('vscode.open', randomUri);
  }
};

export default openRandomNote;
