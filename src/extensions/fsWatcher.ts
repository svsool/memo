import fs from 'fs';
import path from 'path';
import { workspace, window } from 'vscode';
import groupBy from 'lodash.groupby';

import {
  extractShortRef,
  extractLongRef,
  getWorkspaceFolder,
  containsImageExt,
  containsMarkdownExt,
  cacheWorkspace,
  getWorkspaceCache,
  sortPaths,
} from '../utils';

const replaceRefs = ({
  refs,
  content,
  onMatch,
  onReplace,
}: {
  refs: { old: string; new: string }[];
  content: string;
  onMatch?: () => void;
  onReplace?: () => void;
}): string | null => {
  const { updatedOnce, nextContent } = refs.reduce(
    ({ updatedOnce, nextContent }, ref) => {
      const pattern = `\\[\\[${ref.old}(\\|.*)?\\]\\]`;

      if (new RegExp(pattern, 'i').exec(content)) {
        onMatch && onMatch();

        // TODO: Figure how to use WorkspaceEdit API instead to make undo work properly
        const nextContent = content.replace(new RegExp(pattern, 'gi'), ($0, $1) => {
          onReplace && onReplace();

          return `[[${ref.new}${$1 || ''}]]`;
        });

        return {
          updatedOnce: true,
          nextContent,
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

export const activate = async () => {
  const fileWatcher = workspace.createFileSystemWatcher('**/*.{md,png,jpg,jpeg,svg,gif}');

  fileWatcher.onDidCreate(cacheWorkspace);
  fileWatcher.onDidDelete(cacheWorkspace);

  workspace.onDidRenameFiles(async ({ files }) => {
    if (files.some(({ newUri }) => fs.lstatSync(newUri.fsPath).isDirectory())) {
      window.showWarningMessage(
        'Recursive links update on renaming / moving directory is not supported yet.',
      );
    }

    const oldUris = sortPaths(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris],
      { pathKey: 'fsPath', shallowFirst: true },
    );

    const oldUrisByPathBasename = groupBy(oldUris, ({ fsPath }) =>
      path.basename(fsPath).toLowerCase(),
    );

    await cacheWorkspace();

    const newUris = sortPaths(
      [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris],
      { pathKey: 'fsPath', shallowFirst: true },
    );

    const newUrisByPathBasename = groupBy(newUris, ({ fsPath }) =>
      path.basename(fsPath).toLowerCase(),
    );

    let pathsUpdated: string[] = [];

    let refsUpdated: number = 0;

    const addToPathsUpdated = (path: string) =>
      (pathsUpdated = [...new Set([...pathsUpdated, path])]);

    const incrementRefsCounter = () => (refsUpdated += 1);

    const isShortRefAllowed = (
      pathParam: string,
      urisByPathBasename: typeof newUrisByPathBasename,
    ) => {
      // Short ref allowed when non-unique filename comes first in the list of sorted uris.
      // Notice that note name is not required to be unique across multiple folders but only within single folder.
      // /a.md - <-- can be referenced via short ref as [[a]], since it comes first according to paths sorting
      // /folder1/a.md - can be referenced only via long ref as [[folder1/a]]
      // /folder2/subfolder1/a.md - can be referenced only via long ref as [[folder2/subfolder1/a]]
      const urisGroup = urisByPathBasename[path.basename(pathParam).toLowerCase()] || [];
      return urisGroup.findIndex((uriParam) => uriParam.fsPath === pathParam) === 0;
    };

    files.forEach(({ oldUri, newUri }) => {
      const isImage = containsImageExt(oldUri.fsPath) && containsImageExt(newUri.fsPath);
      const isMarkdown = containsMarkdownExt(oldUri.fsPath) && containsMarkdownExt(newUri.fsPath);
      if (isImage || isMarkdown) {
        const workspaceFolder = getWorkspaceFolder()!;
        const oldShortRef = extractShortRef(oldUri.fsPath, isImage)?.ref;
        const newShortRef = extractShortRef(newUri.fsPath, isImage)?.ref;
        const oldLongRef = extractLongRef(workspaceFolder, oldUri.fsPath, isImage)?.ref;
        const newLongRef = extractLongRef(workspaceFolder, newUri.fsPath, isImage)?.ref;
        const oldUriIsShortRef = isShortRefAllowed(oldUri.fsPath, oldUrisByPathBasename);
        const newUriIsShortRef = isShortRefAllowed(newUri.fsPath, newUrisByPathBasename);

        if (!oldShortRef || !newShortRef || !oldLongRef || !newLongRef) {
          return;
        }

        newUris.forEach(({ fsPath: p }) => {
          const fileContent = fs.readFileSync(p).toString();
          let nextContent: string | null = null;

          if (!oldUriIsShortRef && !newUriIsShortRef) {
            // replace long ref with long ref
            // TODO: Consider finding previous short ref and make it point to long ref
            nextContent = replaceRefs({
              refs: [{ old: oldLongRef, new: newLongRef }],
              content: fileContent,
              onMatch: () => addToPathsUpdated(p),
              onReplace: incrementRefsCounter,
            });
          } else if (!oldUriIsShortRef && newUriIsShortRef) {
            // replace long ref with short ref
            nextContent = replaceRefs({
              refs: [{ old: oldLongRef, new: newShortRef }],
              content: fileContent,
              onMatch: () => addToPathsUpdated(p),
              onReplace: incrementRefsCounter,
            });
          } else if (oldUriIsShortRef && !newUriIsShortRef) {
            // replace short ref with long ref
            // TODO: Consider finding new short ref and making long refs point to new short ref
            nextContent = replaceRefs({
              refs: [{ old: oldShortRef, new: newLongRef }],
              content: fileContent,
              onMatch: () => addToPathsUpdated(p),
              onReplace: incrementRefsCounter,
            });
          } else {
            // replace short ref with short ref
            nextContent = replaceRefs({
              refs: [{ old: oldShortRef, new: newShortRef }],
              content: fileContent,
              onMatch: () => addToPathsUpdated(p),
              onReplace: incrementRefsCounter,
            });
          }

          if (nextContent !== null) {
            fs.writeFileSync(p, nextContent);
          }
        });
      }
    });

    if (pathsUpdated.length > 0) {
      window.showInformationMessage(
        `Updated ${refsUpdated} link${refsUpdated === 0 || refsUpdated === 1 ? '' : 's'} in ${
          pathsUpdated.length
        } file${pathsUpdated.length === 0 || pathsUpdated.length === 1 ? '' : 's'}`,
      );
    }
  });
};
