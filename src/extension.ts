import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  completionProvider,
  DocumentLinkProvider,
  extendMarkdownIt,
} from './extensions';
import commands from './commands';
import { cacheWorkspaceUris } from './utils';

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
  await cacheWorkspaceUris();
  context.subscriptions.push(...commands);
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
