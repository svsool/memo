import * as vscode from 'vscode';

function matchAll(pattern: RegExp, text: string): Array<RegExpMatchArray> {
  const out: RegExpMatchArray[] = [];
  pattern.lastIndex = 0;
  let match: RegExpMatchArray | null;
  while ((match = pattern.exec(text))) {
    out.push(match);
  }
  return out;
}

export default class DocumentLinkProvider implements vscode.DocumentLinkProvider {
  private readonly linkPattern = /\[\[(.+?)\]\]/g;

  public provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const results: vscode.DocumentLink[] = [];
    const text = document.getText();

    for (const match of matchAll(this.linkPattern, text)) {
      let linkStart: vscode.Position;
      let linkEnd: vscode.Position;

      const reference = match[1];
      if (reference) {
        const offset = (match.index || 0) + 2;

        linkStart = document.positionAt(offset);
        linkEnd = document.positionAt(offset + reference.length);

        const link = new vscode.DocumentLink(
          new vscode.Range(linkStart, linkEnd),
          vscode.Uri.parse(
            `command:_memo.openTextDocument?${encodeURIComponent(JSON.stringify({ reference }))}`,
          ),
        );

        link.tooltip = 'Follow link';

        results.push(link);
      }
    }

    return results;
  }
}
