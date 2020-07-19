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

export default class ReferenceRenameProvider implements RenameProvider {
  public prepareRename(
    document: TextDocument,
    position: Position,
  ): ProviderResult<Range | { range: Range; placeholder: string }> {
    const refDef = getReferenceAtPosition(document, position);

    if (refDef) {
      const { range, ref, label } = refDef;

      if (!findUriByRef(getWorkspaceCache().allUris, ref)) {
        throw new Error(
          'Rename is not available for nonexistent links. Create file first by clicking on the link.',
        );
      }

      // TODO: Labels don't work well for refs with multiple |||
      // needs testing and fixes
      return new Range(
        new Position(range.start.line, range.start.character + 2),
        new Position(range.end.line, range.end.character - 2 - label.length),
      );
    }

    throw new Error('Rename is not available. Please try when focused on the link.');
  }

  public provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
  ): ProviderResult<WorkspaceEdit> {
    const refDef = getReferenceAtPosition(document, position);

    if (refDef) {
      const { ref } = refDef;

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
