import {
  RenameProvider,
  TextDocument,
  ProviderResult,
  Position,
  Range,
  WorkspaceEdit,
  Uri,
} from 'vscode';
import path from 'path';

import {
  getReferenceAtPosition,
  findUriByRef,
  getWorkspaceCache,
  isLongRef,
  getWorkspaceFolder,
} from '../utils';

const openingBracketsLength = 2;

export default class ReferenceRenameProvider implements RenameProvider {
  public prepareRename(
    document: TextDocument,
    position: Position,
  ): ProviderResult<Range | { range: Range; placeholder: string }> {
    if (document.isDirty) {
      throw new Error('Rename is not available for unsaved files. Please save your changes first.');
    }

    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { range, ref } = refAtPos;

      if (!findUriByRef(getWorkspaceCache().allUris, ref)) {
        throw new Error(
          'Rename is not available for nonexistent links. Create file first by clicking on the link.',
        );
      }

      return new Range(
        new Position(range.start.line, range.start.character + openingBracketsLength),
        new Position(range.start.line, range.start.character + openingBracketsLength + ref.length),
      );
    }

    throw new Error('Rename is not available. Please try when focused on the link.');
  }

  public provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
  ): ProviderResult<WorkspaceEdit> {
    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { ref } = refAtPos;

      const workspaceEdit = new WorkspaceEdit();

      const fsPath = findUriByRef(getWorkspaceCache().allUris, ref)?.fsPath;

      if (fsPath) {
        const newRelativePath = `${newName}${!newName.includes('.') ? '.md' : ''}`;
        const newUri = Uri.file(
          isLongRef(ref)
            ? path.join(getWorkspaceFolder()!, newRelativePath)
            : path.join(path.dirname(fsPath), newRelativePath),
        );

        workspaceEdit.renameFile(Uri.file(fsPath), newUri);
      }

      return workspaceEdit;
    }

    throw new Error('Rename is not available. Please try when focused on the link.');
  }
}
