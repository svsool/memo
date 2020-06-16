import { workspace, window } from 'vscode';
import fs from 'fs';

import {
  extractShortRef,
  containsImageExt,
  containsMarkdownExt,
  cacheWorkspace,
  getWorkspaceCache,
} from '../utils';

export const activate = async () => {
  const fileWatcher = workspace.createFileSystemWatcher('**/*.{md,png,jpg,jpeg,svg,gif}');

  fileWatcher.onDidCreate(cacheWorkspace);
  fileWatcher.onDidDelete(cacheWorkspace);

  workspace.onDidRenameFiles(async ({ files }) => {
    await cacheWorkspace();

    const uris = [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris];

    let filesUpdated: string[] = [];

    let refsUpdated: number = 0;

    // TODO: Support long refs as well, at the moment only short refs supported
    // which will lead to clashes if file with the same name exists in different directories
    files.forEach(({ oldUri, newUri }) => {
      const isImage = containsImageExt(oldUri.fsPath) && containsImageExt(newUri.fsPath);
      const isMarkdown = containsMarkdownExt(oldUri.fsPath) && containsMarkdownExt(newUri.fsPath);
      if (isImage || isMarkdown) {
        const oldShortRef = extractShortRef(oldUri.fsPath, isImage)?.ref;
        const newShortRef = extractShortRef(newUri.fsPath, isImage)?.ref;

        if (!oldShortRef || !newShortRef) {
          return;
        }

        uris.forEach(({ fsPath: p }) => {
          const fileContent = fs.readFileSync(p).toString();

          const pattern = `\\[\\[${oldShortRef}(\\|.*)?\\]\\]`;

          if (new RegExp(pattern, 'i').exec(fileContent)) {
            filesUpdated = [...new Set([...filesUpdated, oldShortRef])];

            // TODO: Figure how to use WorkspaceEdit API instead to make undo work properly
            const newContent = fileContent.replace(new RegExp(pattern, 'gi'), ($0, $1) => {
              refsUpdated++;

              return `[[${newShortRef}${$1 || ''}]]`;
            });

            fs.writeFileSync(p, newContent);
          }
        });
      }
    });

    if (filesUpdated.length > 0) {
      window.showInformationMessage(
        `Updated ${refsUpdated} link${refsUpdated === 0 || refsUpdated === 1 ? '' : 's'} in ${
          filesUpdated.length
        } file${filesUpdated.length === 0 || filesUpdated.length === 1 ? '' : 's'}`,
      );
    }
  });
};
