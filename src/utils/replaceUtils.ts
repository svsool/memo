import path from 'path';
import { Uri, TextDocument } from 'vscode';
import groupBy from 'lodash.groupby';

import {
  fsPathToRef,
  getWorkspaceFolder,
  containsMarkdownExt,
  isDefined,
  getMemoConfigProperty,
  sortPaths,
  getWorkspaceCache,
  findAllUrisWithUnknownExts,
  escapeForRegExp,
} from './utils';
import { isInCodeSpan, isInFencedCodeBlock } from './externalUtils';
import { search } from './searchUtils';

type RenamedFile = {
  readonly oldUri: Uri;
  readonly newUri: Uri;
};

type RefsReplaceEntry = { old: string; new: string };

type RefsReplaceMap = {
  [fsPath: string]: RefsReplaceEntry[];
};

const getBasename = (pathParam: string) => path.basename(pathParam).toLowerCase();

// Short ref allowed when non-unique filename comes first in the list of sorted uris.
// /a.md - <-- can be referenced via short ref as [[a]], since it comes first according to paths sorting
// /folder1/a.md - can be referenced only via long ref as [[folder1/a]]
// /folder2/subfolder1/a.md - can be referenced only via long ref as [[folder2/subfolder1/a]]
const isFirstUriInGroup = (pathParam: string, urisGroup: Uri[] = []) =>
  urisGroup.findIndex((uriParam) => uriParam.fsPath === pathParam) === 0;

export const resolveRefsReplaceMap = async (
  renamedFiles: ReadonlyArray<RenamedFile>,
): Promise<RefsReplaceMap> => {
  const linksFormat = getMemoConfigProperty('links.format', 'short');

  const oldFsPaths = renamedFiles.map(({ oldUri }) => oldUri.fsPath);

  const oldUrisGroupedByBasename = groupBy(
    sortPaths(
      [
        ...getWorkspaceCache().allUris.filter((uri) => !oldFsPaths.includes(uri.fsPath)),
        ...renamedFiles.map(({ oldUri }) => oldUri),
      ],
      {
        pathKey: 'path',
        shallowFirst: true,
      },
    ),
    ({ fsPath }) => path.basename(fsPath).toLowerCase(),
  );

  const newFsPaths = renamedFiles.map(({ newUri }) => newUri.fsPath);

  const allUris = [
    ...getWorkspaceCache().allUris.filter((uri) => !newFsPaths.includes(uri.fsPath)),
    ...renamedFiles.map(({ newUri }) => newUri),
  ];

  const urisWithUnknownExts = await findAllUrisWithUnknownExts(
    renamedFiles.map(({ newUri }) => newUri),
  );

  const newUris = sortPaths(
    [...allUris, ...(urisWithUnknownExts.length ? urisWithUnknownExts : [])],
    {
      pathKey: 'path',
      shallowFirst: true,
    },
  );

  const newUrisGroupedByBasename = groupBy(newUris, ({ fsPath }) =>
    path.basename(fsPath).toLowerCase(),
  );

  const refsReplaceMap: RefsReplaceMap = {};

  for (const { oldUri, newUri } of renamedFiles) {
    const preserveOldExtension = !containsMarkdownExt(oldUri.fsPath);
    const preserveNewExtension = !containsMarkdownExt(newUri.fsPath);
    const workspaceFolder = getWorkspaceFolder()!;
    const oldShortRef = fsPathToRef({
      path: oldUri.fsPath,
      keepExt: preserveOldExtension,
    });
    const oldLongRef = fsPathToRef({
      path: oldUri.fsPath,
      basePath: workspaceFolder,
      keepExt: preserveOldExtension,
    });
    const newShortRef = fsPathToRef({
      path: newUri.fsPath,
      keepExt: preserveNewExtension,
    });
    const newLongRef = fsPathToRef({
      path: newUri.fsPath,
      basePath: workspaceFolder,
      keepExt: preserveNewExtension,
    });
    const oldUriIsShortRef = isFirstUriInGroup(
      oldUri.fsPath,
      oldUrisGroupedByBasename[getBasename(oldUri.fsPath)],
    );
    const newUriIsShortRef = isFirstUriInGroup(
      newUri.fsPath,
      newUrisGroupedByBasename[getBasename(newUri.fsPath)],
    );

    if (!oldShortRef || !newShortRef || !oldLongRef || !newLongRef) {
      return {};
    }

    const fsPaths = await search([`[[${oldShortRef}]]`, `[[${oldLongRef}]]`], workspaceFolder);

    const searchUris = fsPaths.length
      ? newUris.filter(({ fsPath }) => fsPaths.includes(fsPath))
      : newUris;

    for (const { fsPath } of searchUris) {
      if (!containsMarkdownExt(fsPath)) {
        continue;
      }

      if (linksFormat === 'long') {
        refsReplaceMap[fsPath] = [
          // when links format = long re-sync short links with the long ones
          oldUriIsShortRef ? { old: oldShortRef, new: newLongRef } : undefined,
          { old: oldLongRef, new: newLongRef },
        ].filter(isDefined);
      } else if (!oldUriIsShortRef && !newUriIsShortRef) {
        // replace long ref with long ref
        refsReplaceMap[fsPath] = [{ old: oldLongRef, new: newLongRef }];
      } else if (!oldUriIsShortRef && newUriIsShortRef) {
        // replace long ref with short ref
        refsReplaceMap[fsPath] = [{ old: oldLongRef, new: newShortRef }];
      } else if (oldUriIsShortRef && !newUriIsShortRef) {
        // replace short ref with long ref
        refsReplaceMap[fsPath] = [{ old: oldShortRef, new: newLongRef }];
      } else {
        // replace short ref with the short ref
        refsReplaceMap[fsPath] = [
          { old: oldShortRef, new: newShortRef },
          // sync long refs to short ones (might be the case on switching between long & short link formats)
          { old: oldLongRef, new: newShortRef },
        ];
      }
    }
  }

  return refsReplaceMap;
};

export const replaceRefsInDoc = (
  refs: RefsReplaceEntry[],
  document: TextDocument,
  { onMatch, onReplace }: { onMatch?: () => void; onReplace?: () => void } = {},
): string | null => {
  const content = document.getText();

  const { updatedOnce, nextContent } = refs.reduce(
    ({ updatedOnce, nextContent }, ref) => {
      const pattern = `\\[\\[${escapeForRegExp(ref.old)}(\\|.*)?\\]\\]`;

      if (new RegExp(pattern, 'i').exec(content)) {
        let replacedOnce = false;

        const content = nextContent.replace(new RegExp(pattern, 'gi'), ($0, $1, offset) => {
          const pos = document.positionAt(offset);

          if (
            isInFencedCodeBlock(document, pos.line) ||
            isInCodeSpan(document, pos.line, pos.character)
          ) {
            return $0;
          }

          if (!replacedOnce) {
            onMatch && onMatch();
          }

          onReplace && onReplace();

          replacedOnce = true;

          return `[[${ref.new}${$1 || ''}]]`;
        });

        return {
          updatedOnce: true,
          nextContent: content,
        };
      }

      return {
        updatedOnce: updatedOnce,
        nextContent: nextContent,
      };
    },
    { updatedOnce: false, nextContent: content },
  );

  return updatedOnce ? nextContent : null;
};
