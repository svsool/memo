import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  completionProvider,
  DocumentLinkProvider,
  ReferenceHoverProvider,
  extendMarkdownIt,
} from './extensions';
import { cacheWorkspace } from './utils';
import commands from './commands';

export const activate = async (context: vscode.ExtensionContext) => {
  const mdLangSelector = { language: 'markdown', scheme: '*' };
  syntaxDecorations.activate();
  await cacheWorkspace();
  context.subscriptions.push(...commands);
  vscode.languages.registerDocumentLinkProvider(mdLangSelector, new DocumentLinkProvider());
  vscode.languages.registerHoverProvider(mdLangSelector, new ReferenceHoverProvider());
  fsWatcher.activate();
  completionProvider.activate();

  return {
    extendMarkdownIt,
  };
};
