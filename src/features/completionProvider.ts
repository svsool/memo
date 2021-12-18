import {
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
  ExtensionContext,
  MarkdownString,
} from 'vscode';
import util from 'util';
import path from 'path';
import groupBy from 'lodash.groupby';
import fs from 'fs';

import {
  getWorkspaceCache,
  fsPathToRef,
  containsMarkdownExt,
  containsImageExt,
  containsOtherKnownExts,
  getMemoConfigProperty,
  isUncPath,
} from '../utils';

const padWithZero = (n: number): string => (n < 10 ? '0' + n : String(n));

export type MemoCompletionItem = CompletionItem & {
  fsPath?: string;
};

const readFile = util.promisify(fs.readFile);

export const provideCompletionItems = (document: TextDocument, position: Position) => {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  const completionItems: MemoCompletionItem[] = [];

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

    const isFirstUriInGroup =
      urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath) === 0;

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File) as MemoCompletionItem;

    const linksFormat = getMemoConfigProperty('links.format', 'short');

    item.insertText =
      linksFormat === 'long' || linksFormat === 'absolute' || !isFirstUriInGroup
        ? longRef
        : shortRef;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(index);

    item.fsPath = uri.fsPath;

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

export const resolveCompletionItem = async (item: MemoCompletionItem) => {
  if (item.fsPath) {
    try {
      if (containsMarkdownExt(item.fsPath)) {
        item.documentation = new MarkdownString((await readFile(item.fsPath)).toString());
      } else if (containsImageExt(item.fsPath) && !isUncPath(item.fsPath)) {
        item.documentation = new MarkdownString(`![](${Uri.file(item.fsPath).toString()})`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return item;
};

export const activate = (context: ExtensionContext) =>
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'markdown',
      {
        provideCompletionItems,
        resolveCompletionItem,
      },
      '[',
    ),
  );
