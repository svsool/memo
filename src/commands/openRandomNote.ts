import { commands, workspace } from 'vscode';

import { getMarkdownUris } from '../utils';

const openRandomNote = () => {
  const { textDocuments } = workspace;
  const openedFileNames = textDocuments.map((d) => d.fileName);
  const markdownUris = getMarkdownUris().filter(({ fsPath }) => !openedFileNames.includes(fsPath));
  const randomUriIndex = Math.round(Math.random() * markdownUris.length);
  const randomUri = markdownUris[randomUriIndex];

  if (randomUri) {
    commands.executeCommand('vscode.open', randomUri);
  }
};

export default openRandomNote;
