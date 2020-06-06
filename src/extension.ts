import * as vscode from 'vscode';

import * as syntaxDecorations from './syntaxDecorations';
import * as filesCache from './filesCache';
import extendMarkdownIt from './extendMarkdownIt';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
  await filesCache.activate(context);

  return {
    extendMarkdownIt,
  };
};
