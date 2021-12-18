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
  codeActionProvider,
} from './features';
import commands from './commands';
import { cacheWorkspace, getMemoConfigProperty, MemoBoolConfigProp, isDefined } from './utils';

const mdLangSelector = { language: 'markdown', scheme: '*' };

const when = <R>(configKey: MemoBoolConfigProp, cb: () => R): undefined | R =>
  getMemoConfigProperty(configKey, true) ? cb() : undefined;

export const activate = async (
  context: vscode.ExtensionContext,
): Promise<void | { extendMarkdownIt: typeof extendMarkdownIt }> => {
  newVersionNotifier.activate(context);

  when('decorations.enabled', () => syntaxDecorations.activate(context));

  if (process.env.DISABLE_FS_WATCHER !== 'true') {
    fsWatcher.activate(context);
  }

  when('links.completion.enabled', () => completionProvider.activate(context));

  referenceContextWatcher.activate(context);

  await cacheWorkspace();

  context.subscriptions.push(
    ...commands,
    vscode.languages.registerCodeActionsProvider(mdLangSelector, codeActionProvider),
    vscode.workspace.onDidChangeConfiguration(async (configChangeEvent) => {
      if (configChangeEvent.affectsConfiguration('search.exclude')) {
        await cacheWorkspace();
      }
    }),
    ...[
      when('links.following.enabled', () =>
        vscode.languages.registerDocumentLinkProvider(mdLangSelector, new DocumentLinkProvider()),
      ),
      when('links.preview.enabled', () =>
        vscode.languages.registerHoverProvider(mdLangSelector, new ReferenceHoverProvider()),
      ),
      when('links.references.enabled', () =>
        vscode.languages.registerReferenceProvider(mdLangSelector, new ReferenceProvider()),
      ),
      when('links.sync.enabled', () =>
        vscode.languages.registerRenameProvider(mdLangSelector, new ReferenceRenameProvider()),
      ),
    ].filter(isDefined),
  );

  vscode.commands.executeCommand(
    'setContext',
    'memo:backlinksPanel.enabled',
    getMemoConfigProperty('backlinksPanel.enabled', true),
  );

  when('backlinksPanel.enabled', () => {
    const backlinksTreeDataProvider = new BacklinksTreeDataProvider();

    vscode.window.onDidChangeActiveTextEditor(
      async () => await backlinksTreeDataProvider.refresh(),
    );
    context.subscriptions.push(
      vscode.window.createTreeView('memo.backlinksPanel', {
        treeDataProvider: backlinksTreeDataProvider,
        showCollapseAll: true,
      }),
    );
  });

  return when('markdownPreview.enabled', () => ({
    extendMarkdownIt,
  }));
};
