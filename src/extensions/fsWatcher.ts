import fs from 'fs';
import path from 'path';
import { workspace, window, Uri, ExtensionContext } from 'vscode';
import groupBy from 'lodash.groupby';

import {
  fsPathToRef,
  getWorkspaceFolder,
  containsMarkdownExt,
  cacheWorkspace,
  getWorkspaceCache,
  replaceRefs,
  sortPaths,
  findAllUrisWithUnknownExts,
} from '../utils';

const getBasename = (pathParam: string) => path.basename(pathParam).toLowerCase();

// Short ref allowed when non-unique filename comes first in the list of sorted uris.
// /a.md - <-- can be referenced via short ref as [[a]], since it comes first according to paths sorting
// /folder1/a.md - can be referenced only via long ref as [[folder1/a]]
// /folder2/subfolder1/a.md - can be referenced only via long ref as [[folder2/subfolder1/a]]
const isFirstUriInGroup = (pathParam: string, urisGroup: Uri[] = []) =>
  urisGroup.findIndex((uriParam) => uriParam.fsPath === pathParam) === 0;

export const activate = (context: ExtensionContext) => {
  const fileWatcher = workspace.createFileSystemWatcher('**/*.{md,png,jpg,jpeg,svg,gif}');

  const createListenerDisposable = fileWatcher.onDidCreate(cacheWorkspace);
  const deleteListenerDisposable = fileWatcher.onDidDelete(cacheWorkspace);

  const renameFilesDisposable = workspace.onDidRenameFiles(async ({ files }) => {
    await cacheWorkspace();

    if (files.some(({ newUri }) => fs.lstatSync(newUri.fsPath).isDirectory())) {
      window.showWarningMessage(
        'Recursive links update on directory rename is currently not supported.',
      );
    }

    const oldFsPaths = files.map(({ oldUri }) => oldUri.fsPath);

    const oldUrisGroupedByBasename = groupBy(
      sortPaths(
        [
          ...getWorkspaceCache().allUris.filter((uri) => !oldFsPaths.includes(uri.fsPath)),
          ...files.map(({ oldUri }) => oldUri),
        ],
        {
          pathKey: 'path',
          shallowFirst: true,
        },
      ),
      ({ fsPath }) => path.basename(fsPath).toLowerCase(),
    );

    const urisWithUnknownExts = await findAllUrisWithUnknownExts(files.map(({ newUri }) => newUri));

    const newUris = urisWithUnknownExts.length
      ? sortPaths([...getWorkspaceCache().allUris, ...urisWithUnknownExts], {
          pathKey: 'path',
          shallowFirst: true,
        })
      : getWorkspaceCache().allUris;

    const newUrisGroupedByBasename = groupBy(newUris, ({ fsPath }) =>
      path.basename(fsPath).toLowerCase(),
    );

    let pathsUpdated: string[] = [];

    let refsUpdated: number = 0;

    const addToPathsUpdated = (path: string) =>
      (pathsUpdated = [...new Set([...pathsUpdated, path])]);

    const incrementRefsCounter = () => (refsUpdated += 1);

    for (const { oldUri, newUri } of files) {
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
        return;
      }

      for (const { fsPath } of newUris) {
        if (!containsMarkdownExt(fsPath)) {
          continue;
        }

        const doc = await workspace.openTextDocument(Uri.file(fsPath));
        let refs: { old: string; new: string }[] = [];

        if (!oldUriIsShortRef && !newUriIsShortRef) {
          // replace long ref with long ref
          // TODO: Consider finding previous short ref and make it pointing to the long ref
          refs = [{ old: oldLongRef, new: newLongRef }];
        } else if (!oldUriIsShortRef && newUriIsShortRef) {
          // replace long ref with short ref
          refs = [{ old: oldLongRef, new: newShortRef }];
        } else if (oldUriIsShortRef && !newUriIsShortRef) {
          // replace short ref with long ref
          // TODO: Consider finding new short ref and making long refs pointing to the new short ref
          refs = [{ old: oldShortRef, new: newLongRef }];
        } else {
          // replace short ref with short ref
          refs = [{ old: oldShortRef, new: newShortRef }];
        }

        const nextContent = replaceRefs({
          refs,
          document: doc,
          onMatch: () => addToPathsUpdated(fsPath),
          onReplace: incrementRefsCounter,
        });

        if (nextContent !== null) {
          fs.writeFileSync(fsPath, nextContent);
        }
      }
    }

    if (pathsUpdated.length > 0) {
      window.showInformationMessage(
        `Updated ${refsUpdated} link${refsUpdated === 0 || refsUpdated === 1 ? '' : 's'} in ${
          pathsUpdated.length
        } file${pathsUpdated.length === 0 || pathsUpdated.length === 1 ? '' : 's'}`,
      );
    }
  });

  context.subscriptions.push(
    createListenerDisposable,
    deleteListenerDisposable,
    renameFilesDisposable,
  );
};
