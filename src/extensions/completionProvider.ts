import {
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
} from 'vscode';
import path from 'path';
import groupBy from 'lodash.groupby';

import {
  getWorkspaceCache,
  extractLongRef,
  extractShortRef,
  sortPaths,
  containsImageExt,
} from '../utils';

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.endsWith('![[');
  const isDocsAutocomplete = linePrefix.endsWith('[[');

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  const completionItems: CompletionItem[] = [];

  const uris: Uri[] = [
    ...(isResourceAutocomplete
      ? [
          ...sortPaths(getWorkspaceCache().imageUris, { pathKey: 'fsPath', shallowFirst: true }),
          ...sortPaths(getWorkspaceCache().markdownUris, { pathKey: 'fsPath', shallowFirst: true }),
        ]
      : []),
    ...(!isResourceAutocomplete
      ? sortPaths(getWorkspaceCache().markdownUris, { pathKey: 'fsPath', shallowFirst: true })
      : []),
  ];

  const urisByPathBasename = groupBy(uris, ({ fsPath }) => path.basename(fsPath).toLowerCase());

  uris.forEach((uri) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      return;
    }

    const longRef = extractLongRef(
      workspaceFolder.uri.fsPath,
      uri.fsPath,
      containsImageExt(uri.fsPath),
    );

    const shortRef = extractShortRef(uri.fsPath, containsImageExt(uri.fsPath));

    const urisGroup = urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const isFirstUriInGroup =
      urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath) === 0;

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef.ref, CompletionItemKind.File);

    item.insertText = isFirstUriInGroup ? shortRef.ref : longRef.ref;

    completionItems.push(item);
  });

  return completionItems;
};

export const activate = async () => {
  languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems,
    },
    '[',
  );
};
