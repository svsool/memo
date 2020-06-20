import * as vscode from 'vscode';

import { refPattern, matchAll } from '../utils';

export default class DocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly refPattern = new RegExp(refPattern, 'g');

  public provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const results: vscode.DocumentLink[] = [];
    const text = document.getText();

    for (const match of matchAll(this.refPattern, text)) {
      let linkStart: vscode.Position;
      let linkEnd: vscode.Position;

      const reference = match[2];
      if (reference) {
        const offset = (match.index || 0) + 2;

        linkStart = document.positionAt(offset);
        linkEnd = document.positionAt(offset + reference.length);

        const link = new vscode.DocumentLink(
          new vscode.Range(linkStart, linkEnd),
          vscode.Uri.parse(
            `command:_memo.openDocumentByReference?${encodeURIComponent(
              JSON.stringify({ reference }),
            )}`,
          ),
        );

        link.tooltip = 'Follow link';

        results.push(link);
      }
    }

    return results;
  }
}
