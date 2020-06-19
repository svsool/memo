import vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import {
  refPattern,
  containsImageExt,
  getWorkspaceCache,
  isLongRef,
  getConfigProperty,
} from '../utils';

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  private readonly refPattern = new RegExp(refPattern);

  public provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const imagePreviewMaxHeight = Math.max(
      getConfigProperty(document, 'imagePreviewMaxHeight', 200),
      10,
    );

    const range = document.getWordRangeAtPosition(position, this.refPattern);

    if (range) {
      const [reference] = document
        .getText(range)
        .replace('![[', '')
        .replace('[[', '')
        .replace(']]', '')
        .split('|');

      const uris = [...getWorkspaceCache().imageUris, ...getWorkspaceCache().markdownUris];

      // TODO: Move to utils as findUriByRef
      const foundUri = uris.find((uri) => {
        if (isLongRef(reference)) {
          return uri.fsPath
            .toLowerCase()
            .endsWith(
              containsImageExt(reference)
                ? reference.toLowerCase()
                : `${reference.toLowerCase()}.md`,
            );
        }

        if (containsImageExt(reference)) {
          return path.basename(uri.fsPath).toLowerCase() === reference.toLowerCase();
        }

        return path.parse(uri.fsPath).name.toLowerCase() === reference.toLowerCase();
      });

      if (foundUri && fs.existsSync(foundUri.fsPath)) {
        const fileContent = containsImageExt(foundUri.fsPath)
          ? `![](${encodeURI(foundUri.fsPath)}|height=${imagePreviewMaxHeight})`
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
