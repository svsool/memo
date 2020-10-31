import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  containsImageExt,
  containsUnknownExt,
  containsOtherKnownExts,
  getWorkspaceCache,
  getMemoConfigProperty,
  getReferenceAtPosition,
  isUncPath,
  findUriByRef,
  commonExtsHint,
} from '../utils';

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  public provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { ref, range } = refAtPos;
      const hoverRange = new vscode.Range(
        new vscode.Position(range.start.line, range.start.character + 2),
        new vscode.Position(range.end.line, range.end.character - 2),
      );

      const uris = getWorkspaceCache().allUris;
      const foundUri = findUriByRef(uris, ref);

      if (!foundUri && containsUnknownExt(ref)) {
        return new vscode.Hover(
          `Link contains unknown extension: ${
            path.parse(ref).ext
          }. Please use common file extensions ${commonExtsHint} to enable full support.`,
          hoverRange,
        );
      }

      if (foundUri && fs.existsSync(foundUri.fsPath)) {
        const imageMaxHeight = Math.max(
          getMemoConfigProperty('links.preview.imageMaxHeight', 200),
          10,
        );
        const getContent = () => {
          if (containsImageExt(foundUri.fsPath)) {
            return `![${
              isUncPath(foundUri.fsPath)
                ? 'UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.'
                : ''
            }](${vscode.Uri.file(foundUri.fsPath).toString()}|height=${imageMaxHeight})`;
          } else if (containsOtherKnownExts(foundUri.fsPath)) {
            const ext = path.parse(foundUri.fsPath).ext;
            return `Preview is not supported for "${ext}" file type. Click to open in the default app.`;
          }

          return fs.readFileSync(foundUri.fsPath).toString();
        };

        return new vscode.Hover(getContent(), hoverRange);
      }

      return new vscode.Hover(`"${ref}" is not created yet. Click to create.`, hoverRange);
    }

    return null;
  }
}
