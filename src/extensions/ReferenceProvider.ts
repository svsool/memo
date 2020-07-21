import vscode from 'vscode';

import { getReferenceAtPosition, findReferences } from '../utils';

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(document: vscode.TextDocument, position: vscode.Position) {
    const refAtPos = getReferenceAtPosition(document, position);

    return refAtPos
      ? (await findReferences(refAtPos.ref, [document.uri.fsPath])).map(({ location }) => location)
      : [];
  }
}
