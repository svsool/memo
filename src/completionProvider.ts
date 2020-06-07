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

import { getMarkdownPaths, getImagePaths } from './fsCache';
import { extractLongRef, extractShortRef } from './util';

export const activate = async (_: ExtensionContext) => {
  languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems(document: TextDocument, position: Position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        const isResourceAutocomplete = linePrefix.endsWith('![[');

        if (!linePrefix.endsWith('[[') && !isResourceAutocomplete) {
          return undefined;
        }

        const completionItems: CompletionItem[] = [];

        const uris: Uri[] = [
          ...(isResourceAutocomplete ? getImagePaths() : []),
          ...(!isResourceAutocomplete ? getMarkdownPaths() : []),
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
