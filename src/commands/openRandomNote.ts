import { commands } from 'vscode';

import { getMarkdownUris } from '../utils';

const openRandomNote = () => {
  const markdownUris = getMarkdownUris();
  const randomUriIndex = Math.round(Math.random() * markdownUris.length);
  const randomUri = markdownUris[randomUriIndex];

  if (randomUri) {
    commands.executeCommand('vscode.open', randomUri);
  }
};

export default openRandomNote;
