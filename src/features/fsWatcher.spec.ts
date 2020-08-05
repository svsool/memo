import { WorkspaceEdit, Uri, workspace, ExtensionContext } from 'vscode';
import path from 'path';

import * as fsWatcher from './fsWatcher';
import * as utils from '../utils';
import {
  createFile,
  removeFile,
  rndName,
  getWorkspaceFolder,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  cacheWorkspace,
  getWorkspaceCache,
  waitForExpect,
} from '../test/testUtils';

describe('fsWatcher feature', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  let mockContext: ExtensionContext;

  let deactivateFsWatcher: Function;

  beforeEach(() => {
    mockContext = ({
      subscriptions: [],
    } as unknown) as ExtensionContext;

    deactivateFsWatcher = fsWatcher.activate(mockContext, {
      uriCachingDelay: 50,
      documentChangeDelay: 50,
    });
  });

  afterEach(() => {
    deactivateFsWatcher && deactivateFsWatcher();

    mockContext.subscriptions.forEach((sub) => sub.dispose());
  });

  describe('automatic refs update on file rename', () => {
    it('should update short ref with short ref on file rename', async () => {
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

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextNoteName1}]]`));
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

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextNoteName1}|Test Label]]`));
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

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() =>
        expect(doc.getText()).toBe(`[[folder1/${nextNoteName1}|Test Label]]`),
      );
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

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextNoteName1}]]`));
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

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[folder2/${noteName1}]]`));
    });

    it('should update short ref to short ref with unknown extension on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextName = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}]]`, false);
      await createFile(`${noteName1}.md`, '', false);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/${noteName1}.md`),
        Uri.file(`${getWorkspaceFolder()}/${nextName}.unknown`),
      );

      await workspace.applyEdit(edit);

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextName}.unknown]]`));
    });

    it('should update short ref with unknown extension to short ref with a known extension on file rename', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextName = rndName();

      await createFile(`${noteName0}.md`, `[[${noteName1}.unknown]]`, false);
      await createFile(`${noteName1}.unknown`, '', false);

      const edit = new WorkspaceEdit();
      edit.renameFile(
        Uri.file(`${getWorkspaceFolder()}/${noteName1}.unknown`),
        Uri.file(`${getWorkspaceFolder()}/${nextName}.gif`),
      );

      await workspace.applyEdit(edit);

      const doc = await openTextDocument(`${noteName0}.md`);

      await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextName}.gif]]`));
    });
  });

  it('should sync workspace cache on file create', async () => {
    const noteName = rndName();
    const imageName = rndName();

    const workspaceCache0 = await getWorkspaceCache();

    expect([...workspaceCache0.markdownUris, ...workspaceCache0.imageUris]).toHaveLength(0);

    await createFile(`${noteName}.md`, '', false);
    await createFile(`${imageName}.md`, '', false);

    await waitForExpect(async () => {
      const workspaceCache = await utils.getWorkspaceCache();

      expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(2);
      expect(
        [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
          path.basename(fsPath),
        ),
      ).toEqual(expect.arrayContaining([`${noteName}.md`, `${imageName}.md`]));
    });
  });

  it.skip('should sync workspace cache on file remove (For some reason onDidDelete is not called timely in test env)', async () => {
    const noteName = rndName();

    await createFile(`${noteName}.md`);

    const workspaceCache0 = await utils.getWorkspaceCache();

    expect([...workspaceCache0.markdownUris, ...workspaceCache0.imageUris]).toHaveLength(1);
    expect(
      [...workspaceCache0.markdownUris, ...workspaceCache0.imageUris].map(({ fsPath }) =>
        path.basename(fsPath),
      ),
    ).toContain(`${noteName}.md`);

    removeFile(`${noteName}.md`);

    if (require('fs').existsSync(path.join(getWorkspaceFolder()!, `${noteName}.md`))) {
      throw new Error('boom');
    }

    await waitForExpect(async () => {
      const workspaceCache = await utils.getWorkspaceCache();

      expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(0);
      expect(
        [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
          path.basename(fsPath),
        ),
      ).not.toContain(`${noteName}.md`);
    });
  });
});
