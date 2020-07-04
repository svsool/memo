import vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import {
  containsImageExt,
  getWorkspaceCache,
  isLongRef,
  getConfigProperty,
  getReferenceAtPosition,
} from '../utils';

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  public provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const imagePreviewMaxHeight = Math.max(
      getConfigProperty(document, 'imagePreviewMaxHeight', 200),
      10,
    );

    const refResult = getReferenceAtPosition(document, position);

    if (refResult) {
      const { ref, range } = refResult;
      const uris = [...getWorkspaceCache().imageUris, ...getWorkspaceCache().markdownUris];

      // TODO: Move to utils as findUriByRef
      const foundUri = uris.find((uri) => {
        if (isLongRef(ref)) {
          return uri.fsPath
            .toLowerCase()
            .endsWith(containsImageExt(ref) ? ref.toLowerCase() : `${ref.toLowerCase()}.md`);
        }

        if (containsImageExt(ref)) {
          return path.basename(uri.fsPath).toLowerCase() === ref.toLowerCase();
        }

        return path.parse(uri.fsPath).name.toLowerCase() === ref.toLowerCase();
      });

      if (foundUri && fs.existsSync(foundUri.fsPath)) {
        const fileContent = containsImageExt(foundUri.fsPath)
          ? `![](${vscode.Uri.file(foundUri.fsPath).toString()}|height=${imagePreviewMaxHeight})`
          : fs.readFileSync(foundUri.fsPath).toString();

        return new vscode.Hover(
          fileContent,
          new vscode.Range(
            new vscode.Position(range.start.line, range.start.character + 2),
            new vscode.Position(range.end.line, range.end.character - 2),
          ),
        );
      }
    }

    return null;
  }
}
