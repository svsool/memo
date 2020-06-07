import * as vscode from 'vscode';

import * as syntaxDecorations from './syntaxDecorations';
import * as fsCache from './fsCache';
import * as fsWatcher from './fsWatcher';
import * as completionProvider from './completionProvider';
import extendMarkdownIt from './extendMarkdownIt';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
  await fsCache.activate(context);

  fsWatcher.activate(context);
  completionProvider.activate(context);

  return {
    extendMarkdownIt,
  };
};
