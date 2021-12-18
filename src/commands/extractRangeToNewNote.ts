import vscode, { Uri, window } from 'vscode';
import fs from 'fs-extra';
import path from 'path';

const filename = 'New File.md';

const prompt = 'New location within workspace';

const createFile = async (uri: vscode.Uri, content: string) => {
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(uri);
  workspaceEdit.set(uri, [new vscode.TextEdit(new vscode.Range(0, 0, 0, 0), content)]);

  await vscode.workspace.applyEdit(workspaceEdit);
};

const showFile = async (uri: vscode.Uri) =>
  await window.showTextDocument(await vscode.workspace.openTextDocument(uri));

const deleteRange = async (document: vscode.TextDocument, range: vscode.Range) => {
  const editor = await window.showTextDocument(document);
  await editor.edit((edit) => edit.delete(range));
};

const extractRangeToNewNote = async (
  documentParam?: vscode.TextDocument,
  rangeParam?: vscode.Range,
) => {
  const document = documentParam ? documentParam : window.activeTextEditor?.document;

  if (!document || (document && document.languageId !== 'markdown')) {
    return;
  }

  const range = rangeParam ? rangeParam : window.activeTextEditor?.selection;

  if (!range || (range && range.isEmpty)) {
    return;
  }

  const filepath = path.join(path.dirname(document.uri.fsPath), filename);
  const targetPath = await window.showInputBox({
    prompt,
    value: filepath,
    valueSelection: [filepath.lastIndexOf(filename), filepath.lastIndexOf('.md')],
  });

  const targetUri = Uri.file(targetPath || '');

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!targetPath) {
    return;
  }

  if (!vscode.workspace.getWorkspaceFolder(targetUri)) {
    throw new Error(
      `New location "${targetUri.fsPath}" should be within the current workspace.${
        workspaceFolder ? ` Example: ${path.join(workspaceFolder.uri.fsPath, filename)}` : ''
      }`,
    );
  }

  if (await fs.pathExists(targetUri.fsPath)) {
    throw new Error('Such file or directory already exists. Please use unique filename instead.');
  }

  // Order matters
  await createFile(targetUri, document.getText(range).trim());

  await deleteRange(document, range);

  await showFile(targetUri);
};

export default extractRangeToNewNote;
