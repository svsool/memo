import {
  ExtensionContext,
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
} from 'vscode';

import { getMarkdownUris, getImageUris } from './fsCache';
import { extractLongRef, extractShortRef } from './utils';

export const activate = async (_: ExtensionContext) => {
  languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems(document: TextDocument, position: Position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        const isResourceAutocomplete = linePrefix.endsWith('![[');
        const isDocsAutocomplete = linePrefix.endsWith('[[');

        if (!isDocsAutocomplete && !isResourceAutocomplete) {
          return undefined;
        }

        const completionItems: CompletionItem[] = [];

        const uris: Uri[] = [
          ...(isResourceAutocomplete ? getImageUris() : []),
          ...(!isResourceAutocomplete ? getMarkdownUris() : []),
        ];

        for (const uri of uris) {
          const workspaceFolder = workspace.getWorkspaceFolder(uri);

          if (!workspaceFolder) {
            continue;
          }

          const label = extractLongRef(
            workspaceFolder.uri.fsPath,
            uri.fsPath,
            isResourceAutocomplete,
          );

          const shortLabel = extractShortRef(uri.fsPath, isResourceAutocomplete);

          if (!label || !shortLabel) {
            continue;
          }

          const item = new CompletionItem(label, CompletionItemKind.Text);

          item.insertText = shortLabel;

          completionItems.push(item);
        }

        return completionItems;
      },
    },
    '[',
  );
};
