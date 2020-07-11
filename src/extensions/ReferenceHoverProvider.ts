import vscode from 'vscode';
import fs from 'fs';

import {
  containsImageExt,
  getWorkspaceCache,
  getConfigProperty,
  getReferenceAtPosition,
  isUncPath,
  findUriByRef,
} from '../utils';

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  public provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const imagePreviewMaxHeight = Math.max(getConfigProperty('imagePreviewMaxHeight', 200), 10);

    const refResult = getReferenceAtPosition(document, position);

    if (refResult) {
      const { ref, range } = refResult;
      const uris = [...getWorkspaceCache().imageUris, ...getWorkspaceCache().markdownUris];

      const foundUri = findUriByRef(uris, ref);

      const hoverRange = new vscode.Range(
        new vscode.Position(range.start.line, range.start.character + 2),
        new vscode.Position(range.end.line, range.end.character - 2),
      );

      if (foundUri && fs.existsSync(foundUri.fsPath)) {
        const getContent = () => {
          if (containsImageExt(foundUri.fsPath)) {
            return `![${
              isUncPath(foundUri.fsPath)
                ? 'UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.'
                : ''
            }](${vscode.Uri.file(foundUri.fsPath).toString()}|height=${imagePreviewMaxHeight})`;
          }

          return fs.readFileSync(foundUri.fsPath).toString();
        };

        return new vscode.Hover(getContent(), hoverRange);
      } else {
        return new vscode.Hover(`"${ref}" is not created yet. Click to create.`, hoverRange);
      }
    }

    return null;
  }
}
