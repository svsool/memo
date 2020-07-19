import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  completionProvider,
  DocumentLinkProvider,
  ReferenceHoverProvider,
  ReferenceProvider,
  ReferenceRenameProvider,
  BacklinksTreeDataProvider,
  extendMarkdownIt,
} from './extensions';
import { cacheWorkspace } from './utils';
import commands from './commands';

const mdLangSelector = { language: 'markdown', scheme: '*' };

export const activate = async (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate();
  fsWatcher.activate();
  completionProvider.activate();

  await cacheWorkspace();

  const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
  vscode.window.onDidChangeActiveTextEditor(async () => await backlinksTreeDataProvider.refresh());

  context.subscriptions.push(
    ...[
      ...commands,
      vscode.window.createTreeView('memoBacklinksExplorer', {
        treeDataProvider: backlinksTreeDataProvider,
        showCollapseAll: true,
      }),
      vscode.languages.registerDocumentLinkProvider(mdLangSelector, new DocumentLinkProvider()),
      vscode.languages.registerHoverProvider(mdLangSelector, new ReferenceHoverProvider()),
      vscode.languages.registerReferenceProvider(mdLangSelector, new ReferenceProvider()),
      vscode.languages.registerRenameProvider(mdLangSelector, new ReferenceRenameProvider()),
    ],
  );

  return {
    extendMarkdownIt,
  };
};
