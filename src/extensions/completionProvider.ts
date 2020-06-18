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

import { getWorkspaceCache, extractLongRef, extractShortRef, sortPaths } from '../utils';

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.endsWith('![[');
  const isDocsAutocomplete = linePrefix.endsWith('[[');

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  const completionItems: CompletionItem[] = [];

  const uris: Uri[] = sortPaths(
    [
      ...(isResourceAutocomplete ? getWorkspaceCache().imageUris : []),
      ...(!isResourceAutocomplete ? getWorkspaceCache().markdownUris : []),
    ],
    { pathKey: 'fsPath', shallowFirst: true },
  );

  const urisByPathBasename = groupBy(uris, ({ fsPath }) => path.basename(fsPath).toLowerCase());

  for (const uri of uris) {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      continue;
    }

    const longRef = extractLongRef(workspaceFolder.uri.fsPath, uri.fsPath, isResourceAutocomplete);

    const shortRef = extractShortRef(uri.fsPath, isResourceAutocomplete);

    const urisGroup = urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const isFirstUriInGroup =
      urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath) === 0;

    if (!longRef || !shortRef) {
      continue;
    }

    const item = new CompletionItem(longRef.ref, CompletionItemKind.File);

    item.insertText = isFirstUriInGroup ? shortRef.ref : longRef.ref;

    completionItems.push(item);
  }

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
