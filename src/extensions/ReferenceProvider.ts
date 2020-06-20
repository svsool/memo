import vscode from 'vscode';

import { getReferenceAtPosition, findReferences } from '../utils';

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(document: vscode.TextDocument, position: vscode.Position) {
    const refResult = getReferenceAtPosition(document, position);

    return refResult
      ? (await findReferences(refResult.ref, [document.uri.fsPath])).map(({ location }) => location)
      : [];
  }
}
