import {
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
} from 'vscode';

import { getWorkspaceCache, extractLongRef, extractShortRef } from '../utils';

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.endsWith('![[');
  const isDocsAutocomplete = linePrefix.endsWith('[[');

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  const completionItems: CompletionItem[] = [];

  const uris: Uri[] = [
    ...(isResourceAutocomplete ? getWorkspaceCache().imageUris : []),
    ...(!isResourceAutocomplete ? getWorkspaceCache().markdownUris : []),
  ];

  for (const uri of uris) {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      continue;
    }

    const label = extractLongRef(workspaceFolder.uri.fsPath, uri.fsPath, isResourceAutocomplete);

    const shortRef = extractShortRef(uri.fsPath, isResourceAutocomplete);

    if (!label || !shortRef) {
      continue;
    }

    const item = new CompletionItem(label, CompletionItemKind.File);

    item.insertText = shortRef.ref;

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
