import * as vscode from 'vscode';

import {
  syntaxDecorations,
  fsWatcher,
  referenceContextWatcher,
  completionProvider,
  DocumentLinkProvider,
  ReferenceHoverProvider,
  ReferenceProvider,
  ReferenceRenameProvider,
  BacklinksTreeDataProvider,
  extendMarkdownIt,
  newVersionNotifier,
} from './features';
import { cacheWorkspace } from './utils';
import commands from './commands';

const mdLangSelector = { language: 'markdown', scheme: '*' };

export const activate = async (context: vscode.ExtensionContext) => {
  newVersionNotifier.activate(context);
  syntaxDecorations.activate(context);
  if (process.env.DISABLE_FS_WATCHER !== 'true') {
    fsWatcher.activate(context);
  }
  completionProvider.activate(context);
  referenceContextWatcher.activate(context);

  await cacheWorkspace();

  const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
  vscode.window.onDidChangeActiveTextEditor(async () => await backlinksTreeDataProvider.refresh());

  context.subscriptions.push(
    ...commands,
    vscode.workspace.onDidChangeConfiguration(async (configChangeEvent) => {
      if (configChangeEvent.affectsConfiguration('search.exclude')) {
        await cacheWorkspace();
      }
    }),
    vscode.window.createTreeView('memo.backlinksPanel', {
      treeDataProvider: backlinksTreeDataProvider,
      showCollapseAll: true,
    }),
    vscode.languages.registerDocumentLinkProvider(mdLangSelector, new DocumentLinkProvider()),
    vscode.languages.registerHoverProvider(mdLangSelector, new ReferenceHoverProvider()),
    vscode.languages.registerReferenceProvider(mdLangSelector, new ReferenceProvider()),
    vscode.languages.registerRenameProvider(mdLangSelector, new ReferenceRenameProvider()),
  );

  return {
    extendMarkdownIt,
  };
};
