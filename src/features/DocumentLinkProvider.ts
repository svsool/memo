import * as vscode from 'vscode';

import { extractRefsFromText } from '../utils';

export default class DocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly refPattern = new RegExp('\\[\\[([^\\[\\]]+?)\\]\\]', 'g');

  public provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    return extractRefsFromText(this.refPattern, document.getText()).map(({ ref }) => {
      const link = new vscode.DocumentLink(
        new vscode.Range(ref.position.start, ref.position.end),
        vscode.Uri.parse('command:_memo.openDocumentByReference').with({
          query: JSON.stringify({ reference: encodeURIComponent(ref.text) }),
        }),
      );

      link.tooltip = 'Follow link';

      return link;
    });
  }
}
