import { window, Uri } from 'vscode';
import path from 'path';

import BacklinksTreeDataProvider from './BacklinksTreeDataProvider';
import {
  createFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  getWorkspaceFolder,
  toPlainObject,
  updateMemoConfigProperty,
  getConfigProperty,
} from '../test/testUtils';

const getChildren = async () => {
  const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
  const parents = await backlinksTreeDataProvider.getChildren();
  const parentsWithChildren = [];

  for (const parent of parents) {
    parentsWithChildren.push({
      ...parent,
      children: await backlinksTreeDataProvider.getChildren(parent),
    });
  }

  return parentsWithChildren;
};

describe('BacklinksTreeDataProvider()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should provide backlins', async () => {
    const link = rndName();
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${link}.md`);
    await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
    await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

    const doc = await openTextDocument(`${link}.md`);
    await window.showTextDocument(doc);

    expect(toPlainObject(await getChildren())).toMatchObject([
      {
        collapsibleState: 2,
        label: `a-${name0}.md`,
        refs: expect.any(Array),
        description: '(1) ',
        tooltip: `${path.join(getWorkspaceFolder()!, `a-${name0}.md`)}`,
        command: {
          command: 'vscode.open',
          arguments: [
            expect.objectContaining({
              path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
              scheme: 'file',
            }),
            {
              selection: [
                {
                  line: 0,
                  character: 0,
                },
                {
                  line: 0,
                  character: 0,
                },
              ],
            },
          ],
          title: 'Open File',
        },
        children: [
          {
            collapsibleState: 0,
            label: '1:27',
            description: `[[${link}]]`,
            tooltip: `[[${link}]]`,
            command: {
              command: 'vscode.open',
              arguments: [
                expect.objectContaining({
                  path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
                  scheme: 'file',
                }),
                {
                  selection: [
                    {
                      line: 0,
                      character: 27,
                    },
                    {
                      line: 0,
                      character: expect.any(Number),
                    },
                  ],
                },
              ],
              title: 'Open File',
            },
          },
        ],
      },
      {
        collapsibleState: 2,
        label: `b-${name1}.md`,
        refs: expect.any(Array),
        description: '(1) ',
        tooltip: `${path.join(getWorkspaceFolder()!, `b-${name1}.md`)}`,
        command: {
          command: 'vscode.open',
          arguments: [
            expect.objectContaining({
              path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
              scheme: 'file',
            }),
            {
              selection: [
                {
                  line: 0,
                  character: 0,
                },
                {
                  line: 0,
                  character: 0,
                },
              ],
            },
          ],
          title: 'Open File',
        },
        children: [
          {
            collapsibleState: 0,
            label: '1:28',
            description: `[[${link}]]`,
            tooltip: `[[${link}]]`,
            command: {
              command: 'vscode.open',
              arguments: [
                expect.objectContaining({
                  path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
                  scheme: 'file',
                }),
                {
                  selection: [
                    {
                      line: 0,
                      character: 28,
                    },
                    {
                      line: 0,
                      character: expect.any(Number),
                    },
                  ],
                },
              ],
              title: 'Open File',
            },
          },
        ],
      },
    ]);
  });

  it('should provide backlinks for file with parens in name', async () => {
    const link = `Note (${rndName()})`;
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${link}.md`);
    await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
    await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

    const doc = await openTextDocument(`${link}.md`);
    await window.showTextDocument(doc);

    expect(toPlainObject(await getChildren())).toMatchObject([
      {
        collapsibleState: 2,
        label: `a-${name0}.md`,
        refs: expect.any(Array),
        description: '(1) ',
        tooltip: `${path.join(getWorkspaceFolder()!, `a-${name0}.md`)}`,
        command: {
          command: 'vscode.open',
          arguments: [
            expect.objectContaining({
              path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
              scheme: 'file',
            }),
            {
              selection: [
                {
                  line: 0,
                  character: 0,
                },
                {
                  line: 0,
                  character: 0,
                },
              ],
            },
          ],
          title: 'Open File',
        },
        children: [
          {
            collapsibleState: 0,
            label: '1:27',
            description: `[[${link}]]`,
            tooltip: `[[${link}]]`,
            command: {
              command: 'vscode.open',
              arguments: [
                expect.objectContaining({
                  path: Uri.file(path.join(getWorkspaceFolder()!, `a-${name0}.md`)).path,
                  scheme: 'file',
                }),
                {
                  selection: [
                    {
                      line: 0,
                      character: 27,
                    },
                    {
                      line: 0,
                      character: expect.any(Number),
                    },
                  ],
                },
              ],
              title: 'Open File',
            },
          },
        ],
      },
      {
        collapsibleState: 2,
        label: `b-${name1}.md`,
        refs: expect.any(Array),
        description: '(1) ',
        tooltip: `${path.join(getWorkspaceFolder()!, `b-${name1}.md`)}`,
        command: {
          command: 'vscode.open',
          arguments: [
            expect.objectContaining({
              path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
              scheme: 'file',
            }),
            {
              selection: [
                {
                  line: 0,
                  character: 0,
                },
                {
                  line: 0,
                  character: 0,
                },
              ],
            },
          ],
          title: 'Open File',
        },
        children: [
          {
            collapsibleState: 0,
            label: '1:28',
            description: `[[${link}]]`,
            tooltip: `[[${link}]]`,
            command: {
              command: 'vscode.open',
              arguments: [
                expect.objectContaining({
                  path: Uri.file(path.join(getWorkspaceFolder()!, `b-${name1}.md`)).path,
                  scheme: 'file',
                }),
                {
                  selection: [
                    {
                      line: 0,
                      character: 28,
                    },
                    {
                      line: 0,
                      character: expect.any(Number),
                    },
                  ],
                },
              ],
              title: 'Open File',
            },
          },
        ],
      },
    ]);
  });

  it('should collapse parent items according to configuration', async () => {
    const link = rndName();
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${link}.md`);
    await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
    await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

    const doc = await openTextDocument(`${link}.md`);

    await window.showTextDocument(doc);

    await updateMemoConfigProperty('collapseBacklinksPanelItems', true);

    expect((await getChildren()).every((child) => child.collapsibleState === 1)).toBe(true);
  });

  it('should expand parent items according to config', async () => {
    const link = rndName();
    const name0 = rndName();
    const name1 = rndName();

    await createFile(`${link}.md`);
    await createFile(`a-${name0}.md`, `First note with backlink [[${link}]]`);
    await createFile(`b-${name1}.md`, `Second note with backlink [[${link}]]`);

    const doc = await openTextDocument(`${link}.md`);

    await window.showTextDocument(doc);

    expect(getConfigProperty('collapseBacklinksPanelItems', null)).toBe(false);

    expect((await getChildren()).every((child) => child.collapsibleState === 2)).toBe(true);
  });
});
