import {
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
  ExtensionContext,
} from 'vscode';
import fs from 'fs';
import path from 'path';
import groupBy from 'lodash.groupby';

import {
  getWorkspaceCache,
  fsPathToRef,
  containsImageExt,
  containsOtherKnownExts,
  getMemoConfigProperty,
} from '../utils';

const padWithZero = (n: number): string => (n < 10 ? '0' + n : String(n));

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  const completionItems: CompletionItem[] = [];

  const uris: Uri[] = [
    ...(isResourceAutocomplete
      ? [...getWorkspaceCache().imageUris, ...getWorkspaceCache().markdownUris]
      : []),
    ...(!isResourceAutocomplete
      ? [
          ...getWorkspaceCache().markdownUris,
          ...getWorkspaceCache().imageUris,
          ...getWorkspaceCache().otherUris,
        ]
      : []),
  ];

  const urisByPathBasename = groupBy(uris, ({ fsPath }) => path.basename(fsPath).toLowerCase());

  for (const basename in urisByPathBasename) {
    const urisByCanonical = groupBy(urisByPathBasename[basename], (uri) =>
      fs.realpathSync(uri.fsPath),
    );
    const unique = Object.values(urisByCanonical).map((uris) => uris[0]); // take random one, e.g. first
    urisByPathBasename[basename] = unique;
  }

  uris.forEach((uri, index) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      return;
    }

    const longRef = fsPathToRef({
      path: uri.fsPath,
      basePath: workspaceFolder.uri.fsPath,
      keepExt: containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const shortRef = fsPathToRef({
      path: uri.fsPath,
      keepExt: containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const urisGroup = urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const searchResult = urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath);

    const isFirstUriInGroup = searchResult === 0;

    // if all other files with the same basename were symlinks then urisGroup.length will be 1
    // and some uris in main array will be missing in group - that's ok
    const isSymlinked = searchResult === -1 && urisGroup.length === 1;

    if (isSymlinked && getMemoConfigProperty('links.completion.removeRedundantSymlinks', false)) {
      return;
    }

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File);

    const linksFormat = getMemoConfigProperty('links.format', 'short');

    item.insertText =
      linksFormat === 'long' || linksFormat === 'absolute' || (!isFirstUriInGroup && !isSymlinked)
        ? longRef
        : shortRef;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(index);

    completionItems.push(item);
  });

  const danglingRefs = getWorkspaceCache().danglingRefs;

  const completionItemsLength = completionItems.length;

  danglingRefs.forEach((ref, index) => {
    const item = new CompletionItem(ref, CompletionItemKind.File);

    item.insertText = ref;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(completionItemsLength + index);

    completionItems.push(item);
  });

  return completionItems;
};

export const activate = (context: ExtensionContext) =>
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'markdown',
      {
        provideCompletionItems,
      },
      '[',
    ),
  );
