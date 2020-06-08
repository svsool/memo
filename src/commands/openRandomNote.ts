import { commands } from 'vscode';

import { getMarkdownPaths } from '../fsCache';

const openRandomNote = () => {
  const markdownPaths = getMarkdownPaths();
  const randomPathIndex = Math.round(Math.random() * markdownPaths.length);
  const randomPath = markdownPaths[randomPathIndex];

  if (randomPath) {
    commands.executeCommand('vscode.open', randomPath);
  }
};

export default openRandomNote;
