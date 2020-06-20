import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  completionProvider,
  DocumentLinkProvider,
  ReferenceHoverProvider,
  ReferenceProvider,
  BacklinksTreeDataProvider,
  extendMarkdownIt,
} from './extensions';
import { cacheWorkspace } from './utils';
import commands from './commands';

export const activate = async (context: vscode.ExtensionContext) => {
  const mdLangSelector = { language: 'markdown', scheme: '*' };
  syntaxDecorations.activate();
  await cacheWorkspace();
  context.subscriptions.push(...commands);
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
  vscode.window.onDidChangeActiveTextEditor(async () => await backlinksTreeDataProvider.refresh());
  const backlinksExplorer = vscode.window.createTreeView('memoBacklinksExplorer', {
    treeDataProvider: backlinksTreeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(backlinksExplorer);
  vscode.languages.registerDocumentLinkProvider(mdLangSelector, new DocumentLinkProvider());
  vscode.languages.registerHoverProvider(mdLangSelector, new ReferenceHoverProvider());
  vscode.languages.registerReferenceProvider(mdLangSelector, new ReferenceProvider());
  fsWatcher.activate();
  completionProvider.activate();

  return {
    extendMarkdownIt,
  };
};
