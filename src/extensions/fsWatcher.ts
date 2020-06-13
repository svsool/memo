import { workspace, window } from 'vscode';
import fs from 'fs';

import {
  extractShortRef,
  containsImageExt,
  containsMarkdownExt,
  getMarkdownUris,
  getImageUris,
} from '../utils';

export const activate = async () => {
  workspace.onDidRenameFiles(async ({ files }) => {
    const markdownUris = await getMarkdownUris();
    const imageUris = await getImageUris();
    const uris = [...markdownUris, ...imageUris];

    let filesUpdated: string[] = [];

    let refsUpdated: number = 0;

    // TODO: Support long refs as well, at the moment only short refs supported
    // which will lead to clashes if file with the same name exists in different directories
    files.forEach(({ oldUri, newUri }) => {
      const isImage = containsImageExt(oldUri.fsPath) && containsImageExt(newUri.fsPath);
      const isMarkdown = containsMarkdownExt(oldUri.fsPath) && containsMarkdownExt(newUri.fsPath);
      if (isImage || isMarkdown) {
        const oldShortRef = extractShortRef(oldUri.fsPath, isImage);
        const newShortRef = extractShortRef(newUri.fsPath, isImage);

        uris.forEach(({ fsPath: p }) => {
          const fileContent = fs.readFileSync(p);

          if (oldShortRef && fileContent.includes(`[[${oldShortRef}]]`)) {
            filesUpdated = [...new Set([...filesUpdated, oldShortRef])];

            // TODO: Figure how to use WorkspaceEdit API instead to make undo work properly
            const newContent = fileContent
              .toString()
              .replace(new RegExp(`\\[\\[${oldShortRef.toLowerCase()}\\]\\]`, 'gi'), () => {
                refsUpdated++;

                return `[[${newShortRef}]]`;
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
