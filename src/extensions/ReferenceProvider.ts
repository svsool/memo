import vscode from 'vscode';
import fs from 'fs';

import { getWorkspaceCache, matchAll, refPattern } from '../utils';

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(document: vscode.TextDocument, position: vscode.Position) {
    const workspaceCache = getWorkspaceCache();
    const range = document.getWordRangeAtPosition(position, new RegExp(refPattern));
    const locations: vscode.Location[] = [];
    if (range) {
      const [reference] = document
        .getText(range)
        .replace('![[', '')
        .replace('[[', '')
        .replace(']]', '')
        .split('|');

      for (const { fsPath } of workspaceCache.markdownUris) {
        if (fsPath === document.uri.fsPath) {
          continue;
        }

        const fileContent = fs.readFileSync(fsPath).toString();
        const matches = matchAll(
          new RegExp(`\\[\\[(${reference}(\\|.*)?)\\]\\]`, 'gi'),
          fileContent,
        );

        if (matches.length) {
          const currentDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(fsPath));
          matches.forEach((match) => {
            const [, $1] = match;
            const offset = (match.index || 0) + 2;

            const refStart = currentDocument.positionAt(offset);
            const refEnd = currentDocument.positionAt(offset + $1.length);

            locations.push(
              new vscode.Location(vscode.Uri.file(fsPath), new vscode.Range(refStart, refEnd)),
            );
          });
        }
      }
    }

    return locations;
  }
}
