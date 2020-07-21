import vscode from 'vscode';

import {
  getReferenceAtPosition,
  findReferences,
  isInFencedCodeBlock,
  isInCodeSpan,
} from '../utils';

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(document: vscode.TextDocument, position: vscode.Position) {
    if (
      isInFencedCodeBlock(document, position.line) ||
      isInCodeSpan(document, position.line, position.character)
    ) {
      return [];
    }

    const refAtPos = getReferenceAtPosition(document, position);

    return refAtPos
      ? (await findReferences(refAtPos.ref, [document.uri.fsPath])).map(({ location }) => location)
      : [];
  }
}
