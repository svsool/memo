import * as vscode from 'vscode';

import * as syntaxDecorations from './syntaxDecorations';
import * as fsCache from './fsCache';
import * as fsWatcher from './fsWatcher';
import * as completionProvider from './completionProvider';
import extendMarkdownIt from './extendMarkdownIt';
import DocumentLinkProvider from './documentLinkProvider';
import * as commands from './commands';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
  await fsCache.activate(context);
  context.subscriptions.push(
    vscode.commands.registerCommand('_memo.openTextDocument', commands.openTextDocument),
  );
  vscode.languages.registerDocumentLinkProvider(
    { language: 'markdown', scheme: '*' },
    new DocumentLinkProvider(),
  );
  fsWatcher.activate(context);
  completionProvider.activate(context);

  return {
    extendMarkdownIt,
  };
};
