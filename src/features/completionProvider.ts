import { languages, TextDocument, Position, ExtensionContext } from 'vscode';

import { getWorkspaceCache } from '../utils';

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);

  if (isResourceAutocomplete) {
    return [
      ...getWorkspaceCache().resourcesCompletionItems,
      ...getWorkspaceCache().refsCompletionItems,
    ];
  } else if (isDocsAutocomplete) {
    return [...getWorkspaceCache().docsCompletionItems, ...getWorkspaceCache().refsCompletionItems];
  } else {
    return undefined;
  }
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
