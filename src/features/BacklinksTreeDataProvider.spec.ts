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
  getMemoConfigProperty,
} from '../test/utils';

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

describe('BacklinksTreeDataProvider', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should provide backlinks', async () => {
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
        description: '(1)',
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
        description: '(1)',
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
        description: '(1)',
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
        description: '(1)',
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

  describe('issue #209', () => {
    it('should provide proper backlinks for root level non-unique filename', async () => {
      const nonUniqueFilename = `nonUniqueFilename-${rndName()}`;
      const sample1Filename = `sample1-${rndName()}`;
      const sample2Filename = `sample2-${rndName()}`;
      const samplesFolderName = `samples-${rndName()}`;

      await createFile(
        `${samplesFolderName}/${sample1Filename}.md`,
        `Checkout [[${samplesFolderName}/${nonUniqueFilename}]]`,
      );
      await createFile(
        `${samplesFolderName}/${sample2Filename}.md`,
        `Checkout [[${nonUniqueFilename}]]`,
      );
      await createFile(`${samplesFolderName}/${nonUniqueFilename}.md`);
      await createFile(`${nonUniqueFilename}.md`);

      const doc = await openTextDocument(`${nonUniqueFilename}.md`);
      await window.showTextDocument(doc);

      expect(toPlainObject(await getChildren())).toMatchObject([
        {
          collapsibleState: 2,
          label: `${sample2Filename}.md`,
          refs: expect.any(Array),
          description: `(1) ${samplesFolderName}`,
          tooltip: `${path.join(
            getWorkspaceFolder()!,
            samplesFolderName,
            `${sample2Filename}.md`,
          )}`,
          command: {
            command: 'vscode.open',
            arguments: [
              expect.objectContaining({
                path: Uri.file(
                  path.join(getWorkspaceFolder()!, samplesFolderName, `${sample2Filename}.md`),
                ).path,
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
              label: '1:11',
              description: `[[${nonUniqueFilename}]]`,
              tooltip: `[[${nonUniqueFilename}]]`,
              command: {
                command: 'vscode.open',
                arguments: [
                  expect.objectContaining({
                    path: Uri.file(
                      path.join(getWorkspaceFolder()!, samplesFolderName, `${sample2Filename}.md`),
                    ).path,
                    scheme: 'file',
                  }),
                  {
                    selection: [
                      {
                        line: 0,
                        character: 11,
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

    it('should provide proper backlinks for nested non-unique filename', async () => {
      const nonUniqueFilename = `nonUniqueFilename-${rndName()}`;
      const sample1Filename = `sample1-${rndName()}`;
      const sample2Filename = `sample2-${rndName()}`;
      const samplesFolderName = `samples-${rndName()}`;

      await createFile(
        `${samplesFolderName}/${sample1Filename}.md`,
        `Checkout [[${samplesFolderName}/${nonUniqueFilename}]]`,
      );
      await createFile(
        `${samplesFolderName}/${sample2Filename}.md`,
        `Checkout [[${nonUniqueFilename}]]`,
      );
      await createFile(`${samplesFolderName}/${nonUniqueFilename}.md`);
      await createFile(`${nonUniqueFilename}.md`);

      const doc = await openTextDocument(`${samplesFolderName}/${nonUniqueFilename}.md`);
      await window.showTextDocument(doc);

      expect(toPlainObject(await getChildren())).toMatchObject([
        {
          collapsibleState: 2,
          label: `${sample1Filename}.md`,
          refs: expect.any(Array),
          description: `(1) ${samplesFolderName}`,
          tooltip: `${path.join(
            getWorkspaceFolder()!,
            samplesFolderName,
            `${sample1Filename}.md`,
          )}`,
          command: {
            command: 'vscode.open',
            arguments: [
              expect.objectContaining({
                path: Uri.file(
                  path.join(getWorkspaceFolder()!, samplesFolderName, `${sample1Filename}.md`),
                ).path,
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
              label: '1:11',
              description: `[[${samplesFolderName}/${nonUniqueFilename}]]`,
              tooltip: `[[${samplesFolderName}/${nonUniqueFilename}]]`,
              command: {
                command: 'vscode.open',
                arguments: [
                  expect.objectContaining({
                    path: Uri.file(
                      path.join(getWorkspaceFolder()!, samplesFolderName, `${sample1Filename}.md`),
                    ).path,
                    scheme: 'file',
                  }),
                  {
                    selection: [
                      {
                        line: 0,
                        character: 11,
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

    it('should provide proper backlink for long ref', async () => {
      const noteReferencedViaLongRef = `noteReferencedViaLongRef-${rndName()}`;
      const noteWithLongRef = `noteWithLongRef-${rndName()}`;
      const folderName = `folderName-${rndName()}`;

      await createFile(
        `${folderName}/${noteWithLongRef}.md`,
        `Checkout [[${folderName}/${noteReferencedViaLongRef}]]`,
      );
      await createFile(`${folderName}/${noteReferencedViaLongRef}.md`);

      const doc = await openTextDocument(`${folderName}/${noteReferencedViaLongRef}.md`);
      await window.showTextDocument(doc);

      expect(toPlainObject(await getChildren())).toMatchObject([
        {
          collapsibleState: 2,
          label: `${noteWithLongRef}.md`,
          refs: expect.any(Array),
          description: `(1) ${folderName}`,
          tooltip: `${path.join(getWorkspaceFolder()!, folderName, `${noteWithLongRef}.md`)}`,
          command: {
            command: 'vscode.open',
            arguments: [
              expect.objectContaining({
                path: Uri.file(
                  path.join(getWorkspaceFolder()!, folderName, `${noteWithLongRef}.md`),
                ).path,
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
              label: '1:11',
              description: `[[${folderName}/${noteReferencedViaLongRef}]]`,
              tooltip: `[[${folderName}/${noteReferencedViaLongRef}]]`,
              command: {
                command: 'vscode.open',
                arguments: [
                  expect.objectContaining({
                    path: Uri.file(
                      path.join(getWorkspaceFolder()!, folderName, `${noteWithLongRef}.md`),
                    ).path,
                    scheme: 'file',
                  }),
                  {
                    selection: [
                      {
                        line: 0,
                        character: 11,
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
  });

  it('should not provide backlinks for link within code span', async () => {
    const link = rndName();
    const name0 = rndName();

    await createFile(`${link}.md`);
    await createFile(`a-${name0}.md`, `\`[[${link}]]\``);

    const doc = await openTextDocument(`${link}.md`);
    await window.showTextDocument(doc);

    expect(toPlainObject(await getChildren())).toHaveLength(0);
  });

  it('should not provide backlinks for link within code span 2', async () => {
    const link = rndName();
    const name0 = rndName();

    await createFile(`${link}.md`);
    await createFile(
      `a-${name0}.md`,
      `
    Preceding text
    \`[[${link}]]\`
    Following text
    `,
    );

    const doc = await openTextDocument(`${link}.md`);
    await window.showTextDocument(doc);

    expect(toPlainObject(await getChildren())).toHaveLength(0);
  });

  it('should not provide backlinks for link within fenced code block', async () => {
    const link = rndName();
    const name0 = rndName();

    await createFile(`${link}.md`);
    await createFile(
      `a-${name0}.md`,
      `
    \`\`\`
    Preceding text
    [[${link}]]
    Following text
    \`\`\`
    `,
    );

    const doc = await openTextDocument(`${link}.md`);
    await window.showTextDocument(doc);

    expect(toPlainObject(await getChildren())).toHaveLength(0);
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

    await updateMemoConfigProperty('backlinksPanel.collapseParentItems', true);

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

    expect(getMemoConfigProperty('backlinksPanel.collapseParentItems', null)).toBe(false);

    expect((await getChildren()).every((child) => child.collapsibleState === 2)).toBe(true);
  });

  // This test fails under Windows platform, because it does not permit question mark and some other characters in file names
  if (process.platform !== 'win32') {
    it('should provide backlink for file with regexp symbols in name', async () => {
      const linkWithRegexpSymbol = `?`;
      const name0 = rndName();

      await createFile(`${linkWithRegexpSymbol}.md`, `[[${name0}]]`);
      await createFile(`${name0}.md`);

      const doc = await openTextDocument(`${name0}.md`);
      await window.showTextDocument(doc);

      expect(toPlainObject(await getChildren())).toMatchObject([
        {
          collapsibleState: 2,
          label: `${linkWithRegexpSymbol}.md`,
          refs: expect.any(Array),
          description: '(1)',
          tooltip: `${path.join(getWorkspaceFolder()!, `${linkWithRegexpSymbol}.md`)}`,
          command: {
            command: 'vscode.open',
            arguments: [
              expect.objectContaining({
                path: Uri.file(path.join(getWorkspaceFolder()!, `${linkWithRegexpSymbol}.md`)).path,
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
              label: '1:2',
              description: `[[${name0}]]`,
              tooltip: `[[${name0}]]`,
              command: {
                command: 'vscode.open',
                arguments: [
                  expect.objectContaining({
                    path: Uri.file(path.join(getWorkspaceFolder()!, `${linkWithRegexpSymbol}.md`))
                      .path,
                    scheme: 'file',
                  }),
                  {
                    selection: [
                      {
                        line: 0,
                        character: 2,
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
  }
});
