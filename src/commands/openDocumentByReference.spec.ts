import path from 'path';
import { commands, ViewColumn } from 'vscode';

import openDocumentByReference from './openDocumentByReference';
import {
  createFile,
  rndName,
  getWorkspaceFolder,
  getOpenedFilenames,
  getOpenedPaths,
  closeEditorsAndCleanWorkspace,
  toPlainObject,
  updateMemoConfigProperty,
} from '../test/utils';

describe('openDocumentByReference command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should open a text document', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await openDocumentByReference({ reference: name });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, filename)}`);
  });

  it('should create a new text document if does not exist yet', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await openDocumentByReference({ reference: name });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, `${name}.md`)}`);
  });

  it('should open a text document from a reference with label', async () => {
    const name = rndName();

    expect(getOpenedFilenames()).not.toContain(`${name}.md`);

    await openDocumentByReference({
      reference: `${name}|Test Label`,
    });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, `${name}.md`)}`);
  });

  it('should not open a reference on inexact filename match', async () => {
    const name = rndName();
    const filename = `${name}-test.md`;

    await createFile(filename);

    await openDocumentByReference({ reference: 'test' });

    expect(getOpenedFilenames()).not.toContain(filename);
  });

  it('should open document regardless of reference case', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);

    await openDocumentByReference({
      reference: name.toUpperCase(),
    });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, filename)}`);
  });

  it('should open document by a long ref', async () => {
    const name = rndName();
    const filename = `${name}.md`;

    await createFile(filename);
    await createFile(`/folder1/${filename}`);

    await openDocumentByReference({
      reference: `/folder1/${name}`,
    });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, 'folder1', filename)}`);
  });

  it('should open a note instead of an image on short ref', async () => {
    const name = rndName();

    await createFile(`/a/${name}.png`);
    await createFile(`/b/${name}.md`);

    await openDocumentByReference({
      reference: name,
    });

    expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, 'b', `${name}.md`)}`);
  });

  it('should create note automatically including folder if does not exist yet', async () => {
    const name = rndName();

    await openDocumentByReference({
      reference: `folder1/folder2/${name}`,
    });

    expect(getOpenedPaths()).toContain(
      `${path.join(getWorkspaceFolder()!, 'folder1', 'folder2', `${name}.md`)}`,
    );
  });

  it('should create note automatically even with leading slash in the reference', async () => {
    const name = rndName();

    await openDocumentByReference({
      reference: `/folder1/${name}`,
    });

    expect(getOpenedPaths()).toContain(
      `${path.join(getWorkspaceFolder()!, 'folder1', `${name}.md`)}`,
    );
  });

  it('should open png ref with .png extension', async () => {
    const name = rndName();

    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    await openDocumentByReference({
      reference: `${name}.png`,
    });

    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([
      [
        'vscode.open',
        expect.objectContaining({
          $mid: 1,
          path: expect.toEndWith(`${name}.png`),
          scheme: 'file',
        }),
        ViewColumn.Active,
      ],
    ]);

    executeCommandSpy.mockRestore();
  });

  it('should open ref with explicit md extension', async () => {
    const name = rndName();

    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    await openDocumentByReference({
      reference: `${name}.md`,
    });

    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([
      [
        'vscode.open',
        expect.objectContaining({
          $mid: 1,
          path: expect.toEndWith(`${name}.md.md`),
          scheme: 'file',
        }),
        ViewColumn.Active,
      ],
    ]);

    executeCommandSpy.mockRestore();
  });

  it('should take showOption to open ref to the side', async () => {
    const executeCommandSpy = jest.spyOn(commands, 'executeCommand');

    const name = rndName();
    await openDocumentByReference({
      reference: `${name}`,
      showOption: ViewColumn.Beside,
    });
    expect(
      toPlainObject(executeCommandSpy.mock.calls.filter(([command]) => command === 'vscode.open')),
    ).toMatchObject([
      [
        'vscode.open',
        expect.objectContaining({
          $mid: 1,
          path: expect.toEndWith(`${name}.md`),
          scheme: 'file',
        }),
        ViewColumn.Beside,
      ],
    ]);

    executeCommandSpy.mockRestore();
  });

  describe('with custom links.rules config', () => {
    it('should create a note in a configured sub dir', async () => {
      await updateMemoConfigProperty('links.rules', [
        {
          rule: '.*\\.md$',
          comment: 'all notes',
          folder: '/Notes',
        },
      ]);

      const name = rndName();

      expect(getOpenedFilenames()).not.toContain(`${name}.md`);

      await openDocumentByReference({ reference: name });

      expect(getOpenedPaths()).toContain(
        `${path.join(getWorkspaceFolder()!, 'Notes', `${name}.md`)}`,
      );
    });

    it('should not create a note in a configured sub dir for long links', async () => {
      await updateMemoConfigProperty('links.rules', [
        {
          rule: '.*\\.md$',
          comment: 'all notes',
          folder: '/Notes',
        },
      ]);

      const name = `dir/${rndName()}`;

      expect(getOpenedFilenames()).not.toContain(`${name}.md`);

      await openDocumentByReference({ reference: name });

      expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, `${name}.md`)}`);
    });

    it('should create a note in a root dir when no matching rule found', async () => {
      await updateMemoConfigProperty('links.rules', [
        {
          rule: '.*\\.txt$',
          comment: 'all text',
          folder: '/Text',
        },
      ]);

      const name = rndName();

      expect(getOpenedFilenames()).not.toContain(`${name}.md`);

      await openDocumentByReference({ reference: name });

      expect(getOpenedPaths()).toContain(`${path.join(getWorkspaceFolder()!, `${name}.md`)}`);
    });

    it('should handle regexp capture groups properly', async () => {
      await updateMemoConfigProperty('links.rules', [
        {
          rule: '(\\d{4})-(\\d{2})-(\\d{2})\\.md$',
          comment: 'Daily notes yyyy-mm-dd',
          folder: '/Daily/$1-$2-$3',
        },
      ]);

      const name = `${rndName()}-2000-10-10`;

      expect(getOpenedFilenames()).not.toContain(`${name}.md`);

      await openDocumentByReference({ reference: name });

      expect(getOpenedPaths()).toContain(
        `${path.join(getWorkspaceFolder()!, 'Daily/2000-10-10', `${name}.md`)}`,
      );
    });

    it('should handle known variables properly', async () => {
      await updateMemoConfigProperty('links.rules', [
        {
          rule: '.*\\.md$',
          comment: 'all notes',
          folder: '/Notes/$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE',
        },
      ]);

      const name = rndName();

      expect(getOpenedFilenames()).not.toContain(`${name}.md`);

      await openDocumentByReference({ reference: name });

      const date = new Date();
      const currentYear = String(date.getFullYear());
      const currentMonth = String(date.getMonth().valueOf() + 1).padStart(2, '0');
      const currentDate = String(date.getDate().valueOf()).padStart(2, '0');

      expect(getOpenedPaths()).toContain(
        `${path.join(
          getWorkspaceFolder()!,
          'Notes',
          `${currentYear}-${currentMonth}-${currentDate}`,
          `${name}.md`,
        )}`,
      );
    });
  });
});
