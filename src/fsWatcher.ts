import { ExtensionContext, workspace, window, WorkspaceEdit } from 'vscode';
import path from 'path';
import fs from 'fs';

import { sync, getMarkdownPaths, getImagePaths } from './fsCache';

const allExts = /\.(md|png|jpg|jpeg|svg|gif)$/;

// const extractLongRef = (basePathParam: string, pathParam: string): string | null => {
//   const allExtsMatch = allExts.exec(pathParam);
//
//   if (allExtsMatch) {
//     return pathParam.replace(basePathParam, '').replace(allExts, '');
//   }
//
//   return null;
// };

const extractShortRef = (pathParam: string): string | null => {
  const allExtsMatch = allExts.exec(pathParam);

  if (allExtsMatch) {
    return path.basename(pathParam).replace(allExts, '');
  }

  return null;
};

export const activate = async (_: ExtensionContext) => {
  workspace.onDidRenameFiles(async ({ files }) => {
    await sync();

    const paths = [...getMarkdownPaths(), ...getImagePaths()];

    let filesUpdated: string[] = [];

    let refsUpdated: number = 0;

    // TODO: Support long refs as well, at the moment only short refs supported
    // but it will lead to clashes if file with the same name exists in different directories
    files.forEach(({ oldUri, newUri }) => {
      const oldShortRef = extractShortRef(oldUri.fsPath);
      const newShortRef = extractShortRef(newUri.fsPath);

      paths.forEach((p) => {
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
    });

    if (filesUpdated.length > 0) {
      window.showInformationMessage(
        `Updated ${refsUpdated} link${refsUpdated === 0 || refsUpdated === 1 ? '' : 's'} in ${
          filesUpdated.length
        } file${filesUpdated.length === 0 || filesUpdated.length === 1 ? '' : 's'}`,
      );
    }
  });

  workspace.onDidCreateFiles(async () => await sync());

  workspace.onDidDeleteFiles(async () => await sync());
};
