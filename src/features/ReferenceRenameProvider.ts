import { RenameProvider, TextDocument, Position, Range, WorkspaceEdit, Uri } from 'vscode';
import path from 'path';

import { cache } from '../workspace';
import {
  getReferenceAtPosition,
  findUriByRef,
  isLongRef,
  getWorkspaceFolder,
  containsMarkdownExt,
  containsUnknownExt,
  findFilesByExts,
  extractExt,
  crossPathSort,
} from '../utils';

const openingBracketsLength = 2;

export default class ReferenceRenameProvider implements RenameProvider {
  public async prepareRename(
    document: TextDocument,
    position: Position,
  ): Promise<Range | { range: Range; placeholder: string }> {
    if (document.isDirty) {
      throw new Error('Rename is not available for unsaved files. Please save your changes first.');
    }

    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { range, ref } = refAtPos;

      const unknownUris = containsUnknownExt(ref) ? await findFilesByExts([extractExt(ref)]) : [];

      const augmentedUris = unknownUris.length
        ? crossPathSort([...cache.getWorkspaceCache().allUris, ...unknownUris], {
            pathKey: 'path',
            shallowFirst: true,
          })
        : cache.getWorkspaceCache().allUris;

      if (!findUriByRef(augmentedUris, ref)) {
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

  public async provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
  ): Promise<WorkspaceEdit> {
    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { ref } = refAtPos;

      const workspaceEdit = new WorkspaceEdit();

      const unknownUris = containsUnknownExt(ref) ? await findFilesByExts([extractExt(ref)]) : [];

      const augmentedUris = unknownUris.length
        ? crossPathSort([...cache.getWorkspaceCache().allUris, ...unknownUris], {
            pathKey: 'path',
            shallowFirst: true,
          })
        : cache.getWorkspaceCache().allUris;

      const fsPath = findUriByRef(augmentedUris, ref)?.fsPath;

      if (fsPath) {
        const ext = path.parse(newName).ext;
        const newRelativePath = `${newName}${
          ext === '' || (containsUnknownExt(newName) && containsMarkdownExt(fsPath)) ? '.md' : ''
        }`;
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
