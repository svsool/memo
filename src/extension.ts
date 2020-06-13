import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  completionProvider,
  DocumentLinkProvider,
  extendMarkdownIt,
} from './extensions';
import commands from './commands';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate();
  context.subscriptions.push(...commands);
  vscode.languages.registerDocumentLinkProvider(
    { language: 'markdown', scheme: '*' },
    new DocumentLinkProvider(),
  );
  fsWatcher.activate();
  completionProvider.activate();

  return {
    extendMarkdownIt: await extendMarkdownIt(),
  };
};
