import fs from 'fs';
import { FileRenameEvent, TextDocument, Uri, window, workspace } from 'vscode';

import {
  addCachedRefs,
  cacheUris,
  containsMarkdownExt,
  getMemoConfigProperty,
  removeCachedRefs,
  replaceRefsInDoc,
  resolveRefsReplaceMap,
} from '../../utils';

export const handleFileCreate = async (
  newUri: Uri,
  cacheUrisFn: () => Promise<void> = cacheUris,
) => {
  await cacheUrisFn();
  await addCachedRefs([newUri]);
};

export const handleFileDelete = async (
  removedUri: Uri,
  cacheUrisFn: () => Promise<void> = cacheUris,
) => {
  await cacheUrisFn();
  await removeCachedRefs([removedUri]);
};

export const handleDocChange = async ({ uri }: TextDocument) => {
  if (containsMarkdownExt(uri.fsPath)) {
    await addCachedRefs([uri]);
  }
};

export const handleFilesRename = async ({ files }: FileRenameEvent) => {
  await cacheUris();

  if (!getMemoConfigProperty('links.sync.enabled', true)) {
    return;
  }

  if (files.some(({ newUri }) => fs.lstatSync(newUri.fsPath).isDirectory())) {
    window.showWarningMessage(
      'Recursive links update on directory rename is currently not supported.',
    );
  }

  let pathsUpdated: string[] = [];

  let refsUpdated: number = 0;

  const addToPathsUpdated = (path: string) =>
    (pathsUpdated = [...new Set([...pathsUpdated, path])]);

  const incrementRefsCounter = () => (refsUpdated += 1);

  const refsReplaceMap = await resolveRefsReplaceMap(files);

  for (const fsPath in refsReplaceMap) {
    const doc = await workspace.openTextDocument(Uri.file(fsPath));
    const refsReplaceEntry = refsReplaceMap[fsPath];

    const nextContent = replaceRefsInDoc(refsReplaceEntry, doc, {
      onMatch: () => addToPathsUpdated(fsPath),
      onReplace: incrementRefsCounter,
    });

    if (nextContent !== null) {
      fs.writeFileSync(fsPath, nextContent);
    }
  }

  if (pathsUpdated.length > 0) {
    window.showInformationMessage(
      `Updated ${refsUpdated} link${refsUpdated === 0 || refsUpdated === 1 ? '' : 's'} in ${
        pathsUpdated.length
      } file${pathsUpdated.length === 0 || pathsUpdated.length === 1 ? '' : 's'}`,
    );
  }
};
