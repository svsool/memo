import { WorkspaceEdit, Uri, workspace } from 'vscode';
import path from 'path';

import { getWorkspaceFolder } from '../utils';
import {
  createFile,
  removeFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  getWorkspaceCache,
  delay,
} from '../test/testUtils';

describe('fsWatcher extension', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  describe('automatic refs update on file rename', () => {
    it('should update ref without label on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}]]`);
      await createFile(`${noteName1}.md`);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/${nextNoteName1}.md`),
      );

      await workspace.applyEdit(edit);

      // onDidRenameFiles handler is not fired immediately
      await delay(100);

      const doc = await openTextDocument(`${noteName0}.md`);

      expect(doc.getText()).toBe(`[[${nextNoteName1}]]`);
    });

    it('should update ref with label on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}|Test Label]]`);
      await createFile(`${noteName1}.md`);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/${nextNoteName1}.md`),
      );

      await workspace.applyEdit(edit);

      // onDidRenameFiles handler is not fired immediately
      await delay(100);

      const doc = await openTextDocument(`${noteName0}.md`);

      expect(doc.getText()).toBe(`[[${nextNoteName1}|Test Label]]`);
    });
  });

  it('should sync cache on file create', async () => {
    const noteName = rndName();
    const imageName = rndName();

    const workspaceCache0 = await getWorkspaceCache();

    expect([...workspaceCache0.markdownUris, ...workspaceCache0.imageUris]).toHaveLength(0);

    await createFile(`${noteName}.md`, '', false);
    await createFile(`${imageName}.md`, '', false);

    // onDidCreate handler is not fired immediately
    await delay(100);

    const workspaceCache = await getWorkspaceCache();

    expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(2);
    expect(
      [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toEqual(expect.arrayContaining([`${noteName}.md`, `${imageName}.md`]));
  });

  it('should sync cache on file remove', async () => {
    const noteName = rndName();

    await createFile(`${noteName}.md`);

    const workspaceCache0 = await getWorkspaceCache();

    expect([...workspaceCache0.markdownUris, ...workspaceCache0.imageUris]).toHaveLength(1);
    expect(
      [...workspaceCache0.markdownUris, ...workspaceCache0.imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toContain(`${noteName}.md`);

    await removeFile(`${noteName}.md`);

    // onDidDelete handler is not fired immediately
    await delay(100);

    const workspaceCache = await getWorkspaceCache();

    expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(0);
    expect(
      [...workspaceCache0.markdownUris, ...workspaceCache0.imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).not.toContain(`${noteName}.md`);
  });
});
