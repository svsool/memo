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
import path from 'path';
import groupBy from 'lodash.groupby';

import completionProviderTriggerCharacters from './completionProviderTriggerCharacters';
import {
  getWorkspaceCache,
  extractLongRef,
  extractShortRef,
  containsImageExt,
  containsOtherKnownExts,
  getConfigProperty,
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

  uris.forEach((uri, index) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      return;
    }

    const longRef = extractLongRef(
      workspaceFolder.uri.fsPath,
      uri.fsPath,
      containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    );

    const shortRef = extractShortRef(
      uri.fsPath,
      containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    );

    const urisGroup = urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const isFirstUriInGroup =
      urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath) === 0;

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef.ref, CompletionItemKind.File);

    item.insertText = isFirstUriInGroup ? shortRef.ref : longRef.ref;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(index);

    completionItems.push(item);
  });

  return completionItems;
};

export const activate = async (context: ExtensionContext) => {
  const useEnhancedTriggerSuggest = getConfigProperty('useEnhancedTriggerSuggest', false);

  const triggerCharacters = useEnhancedTriggerSuggest ? completionProviderTriggerCharacters : ['['];

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'markdown',
      {
        provideCompletionItems,
      },
      ...triggerCharacters,
    ),
  );
};
