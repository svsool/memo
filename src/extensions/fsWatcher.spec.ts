import { WorkspaceEdit, Uri, workspace } from 'vscode';
import path from 'path';

import {
  createFile,
  removeFile,
  rndName,
  getWorkspaceFolder,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  cacheWorkspace,
  getWorkspaceCache,
  delay,
} from '../test/testUtils';

describe('fsWatcher extension', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  describe('automatic refs update on file rename', () => {
    it('should update short ref without label with short ref without label on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}]]`, false);
      await createFile(`${noteName1}.md`, '', false);

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

    it('should update short ref with label with another short ref with label on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}|Test Label]]`, false);
      await createFile(`${noteName1}.md`, '', false);

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

    it('should update long ref with long ref on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[folder1/${noteName1}|Test Label]]`, false);
      await createFile(`${noteName1}.md`, '', false);
      await createFile(`${nextNoteName1}.md`, '', false);
      await createFile(`/folder1/${noteName1}.md`, '', false);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/folder1/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/folder1/${nextNoteName1}.md`),
      );

      await workspace.applyEdit(edit);

      // onDidRenameFiles handler is not fired immediately
      await delay(100);

      const doc = await openTextDocument(`${noteName0}.md`);

      expect(doc.getText()).toBe(`[[folder1/${nextNoteName1}|Test Label]]`);
    });

    it('should update long ref with short ref on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[folder1/${noteName1}]]`, false);
      await createFile(`${noteName1}.md`, '', false);
      await createFile(`/folder1/${noteName1}.md`, '', false);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/folder1/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/folder1/${nextNoteName1}.md`),
      );

      await workspace.applyEdit(edit);

      // onDidRenameFiles handler is not fired immediately
      await delay(100);

      const doc = await openTextDocument(`${noteName0}.md`);

      expect(doc.getText()).toBe(`[[${nextNoteName1}]]`);
    });

    it('should update short ref with long ref on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}]]`, false);
      await createFile(`${noteName1}.md`, '', false);
      await createFile(`/folder1/${noteName1}.md`, '', false);

      await cacheWorkspace();

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/folder2/${noteName1}.md`),
      );

      await workspace.applyEdit(edit);

      // onDidRenameFiles handler is not fired immediately
      await delay(100);

      const doc = await openTextDocument(`${noteName0}.md`);

      expect(doc.getText()).toBe(`[[folder2/${noteName1}]]`);
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

    await createFile(`${noteName}.md`, '', false);

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
