import * as vscode from 'vscode';

import * as syntaxDecorations from './syntaxDecorations';
import * as fsCache from './fsCache';
import * as fsWatcher from './fsWatcher';
import extendMarkdownIt from './extendMarkdownIt';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
  await fsCache.activate(context);

  fsWatcher.activate(context);

  return {
    extendMarkdownIt,
  };
};
