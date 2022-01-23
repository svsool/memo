import { WorkspaceEdit, Uri, workspace, ExtensionContext, window, Range, Position } from 'vscode';
import path from 'path';

import * as fileWatcher from './fileWatcher';
import * as cache from '../cache';
import {
  createFile,
  removeFile,
  rndName,
  getWorkspaceFolder,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  cacheWorkspace,
  getWorkspaceCache,
  updateMemoConfigProperty,
  waitForExpect,
} from '../../test/utils';

describe('fileWatcher', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  let mockContext: ExtensionContext;

  let deactivateFileWatcher: Function;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
    } as unknown as ExtensionContext;

    deactivateFileWatcher = fileWatcher.activate(mockContext, {
      uriCachingDelay: 50,
      documentChangeDelay: 50,
    });
  });

  afterEach(() => {
    deactivateFileWatcher && deactivateFileWatcher();

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

    it('should update long ref with short ref on file rename 2', async () => {
      const noteName0 = rndName();
      const noteName1 = rndName();
      const nextNoteName1 = rndName();

      await createFile(`${noteName0}.md`, `[[folder1/${noteName1}]]`, false);
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

    describe('with links.format = long', () => {
      beforeEach(async () => {
        await updateMemoConfigProperty('links.format', 'long');
      });

      it('should update short ref with long ref on file rename', async () => {
        const noteName0 = rndName();
        const noteName1 = rndName();

        await createFile(`${noteName0}.md`, `[[${noteName1}]]`, false);
        await createFile(`/folder1/${noteName1}.md`, '', false);

        await cacheWorkspace();

        const edit = new WorkspaceEdit();
        edit.renameFile(
          Uri.file(`${getWorkspaceFolder()}/folder1/${noteName1}.md`),
          Uri.file(`${getWorkspaceFolder()}/folder2/${noteName1}.md`),
        );

        await workspace.applyEdit(edit);

        const doc = await openTextDocument(`${noteName0}.md`);

        await waitForExpect(() => expect(doc.getText()).toBe(`[[folder2/${noteName1}]]`));
      });

      it('should update long ref with short ref on moving file to workspace root', async () => {
        const noteName0 = rndName();
        const noteName1 = rndName();
        const nextNoteName1 = rndName();

        await createFile(`${noteName0}.md`, `[[folder1/${noteName1}]]`, false);
        await createFile(`/folder1/${noteName1}.md`, '', false);

        const edit = new WorkspaceEdit();
        edit.renameFile(
          Uri.file(`${getWorkspaceFolder()}/folder1/${noteName1}.md`),
          Uri.file(`${getWorkspaceFolder()}/${nextNoteName1}.md`),
        );

        await workspace.applyEdit(edit);

        const doc = await openTextDocument(`${noteName0}.md`);

        await waitForExpect(() => expect(doc.getText()).toBe(`[[${nextNoteName1}]]`));
      });

      it('should update long ref with long ref on file rename', async () => {
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

        await waitForExpect(() => expect(doc.getText()).toBe(`[[folder1/${nextNoteName1}]]`));
      });

      it('should not touch short ref', async () => {
        const noteName0 = rndName();
        const noteName1 = rndName();
        const nextNoteName1 = rndName();

        await createFile(`${noteName0}.md`, `[[${noteName1}]] [[folder1/${noteName1}]]`, false);
        await createFile(`${noteName1}.md`, '', false);
        await createFile(`/folder1/${noteName1}.md`, '', false);

        const edit = new WorkspaceEdit();
        edit.renameFile(
          Uri.file(`${getWorkspaceFolder()}/folder1/${noteName1}.md`),
          Uri.file(`${getWorkspaceFolder()}/folder1/${nextNoteName1}.md`),
        );

        await workspace.applyEdit(edit);

        const doc = await openTextDocument(`${noteName0}.md`);

        await waitForExpect(() =>
          expect(doc.getText()).toBe(`[[${noteName1}]] [[folder1/${nextNoteName1}]]`),
        );
      });
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
      const workspaceCache = await cache.getWorkspaceCache();

      expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(2);
      expect(
        [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
          path.basename(fsPath),
        ),
      ).toEqual(expect.arrayContaining([`${noteName}.md`, `${imageName}.md`]));
    });
  });

  it('should add new dangling refs to cache on file create', async () => {
    const noteName = rndName();

    expect(cache.getWorkspaceCache().danglingRefs).toEqual([]);
    expect(cache.getWorkspaceCache().danglingRefsByFsPath).toEqual({});

    await createFile(`${noteName}.md`, '[[dangling-ref]] [[dangling-ref2]]', false);

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'dangling-ref2']);
      expect(Object.values(cache.getWorkspaceCache().danglingRefsByFsPath)).toEqual([
        ['dangling-ref', 'dangling-ref2'],
      ]);
    });
  });

  it('should remove dangling refs from cache on file remove', async () => {
    const noteName = rndName();

    await createFile(`${noteName}.md`, '[[dangling-ref]] [[dangling-ref2]]', false);

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'dangling-ref2']);
      expect(Object.values(cache.getWorkspaceCache().danglingRefsByFsPath)).toEqual([
        ['dangling-ref', 'dangling-ref2'],
      ]);
    });

    await removeFile(`${noteName}.md`);

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual([]);
      expect(cache.getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    });
  });

  it('should add and remove dangling refs on file edit', async () => {
    const noteName = rndName();

    await createFile(`${noteName}.md`, '[[dangling-ref]]', false);

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);
      expect(Object.values(cache.getWorkspaceCache().danglingRefsByFsPath)).toEqual([
        ['dangling-ref'],
      ]);
    });

    const doc = await openTextDocument(`${noteName}.md`);

    const editor = await window.showTextDocument(doc);

    await editor.edit((edit) => edit.insert(new Position(1, 0), '\n[[he]]'));

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'he']);
      expect(Object.values(cache.getWorkspaceCache().danglingRefsByFsPath)).toEqual([
        ['dangling-ref', 'he'],
      ]);
    });

    await editor.edit((edit) => {
      edit.delete(new Range(new Position(1, 0), new Position(2, 0)));
      edit.insert(new Position(1, 0), '[[hello]]');
    });

    await waitForExpect(() => {
      expect(cache.getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'hello']);
      expect(Object.values(cache.getWorkspaceCache().danglingRefsByFsPath)).toEqual([
        ['dangling-ref', 'hello'],
      ]);
    });
  });

  it('should sync workspace cache on file remove', async () => {
    const noteName = rndName();

    await createFile(`${noteName}.md`, '', false);

    await waitForExpect(async () => {
      const workspaceCache = await cache.getWorkspaceCache();

      expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(1);
      expect(
        [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
          path.basename(fsPath),
        ),
      ).toContain(`${noteName}.md`);
    });

    removeFile(`${noteName}.md`);

    await waitForExpect(async () => {
      const workspaceCache = await cache.getWorkspaceCache();

      expect([...workspaceCache.markdownUris, ...workspaceCache.imageUris]).toHaveLength(0);
      expect(
        [...workspaceCache.markdownUris, ...workspaceCache.imageUris].map(({ fsPath }) =>
          path.basename(fsPath),
        ),
      ).not.toContain(`${noteName}.md`);
    });
  });
});
