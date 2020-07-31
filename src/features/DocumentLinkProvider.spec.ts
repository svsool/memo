import DocumentLinkProvider from './DocumentLinkProvider';
import {
  createFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  toPlainObject,
} from '../test/testUtils';

describe('DocumentLinkProvider', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not return anything for empty document', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename);

    const doc = await openTextDocument(filename);

    const linkProvider = new DocumentLinkProvider();

    expect(linkProvider.provideDocumentLinks(doc)).toHaveLength(0);
  });

  it('should not provide a link for the invalid ref', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename, '[[]]');

    const doc = await openTextDocument(filename);

    const linkProvider = new DocumentLinkProvider();

    expect(linkProvider.provideDocumentLinks(doc)).toHaveLength(0);
  });

  it('should provide a correct link to existing note even when brackets are unbalanced', async () => {
    const noteName0 = rndName();
    const noteName1 = rndName();

    await createFile(`${noteName0}.md`, `[[[[${noteName1}]]]]]]`);
    await createFile(`${noteName1}.md`);

    const doc = await openTextDocument(`${noteName0}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toHaveLength(1);
    expect(toPlainObject(links[0])).toMatchObject({
      range: [
        {
          line: 0,
          character: expect.any(Number),
        },
        {
          line: 0,
          character: expect.any(Number),
        },
      ],
      target: {
        $mid: 1,
        path: '_memo.openDocumentByReference',
        scheme: 'command',
        query: `{"reference":"${noteName1}"}`,
      },
      tooltip: 'Follow link',
    });
  });

  it('should provide link to existing note', async () => {
    const noteName0 = rndName();
    const noteName1 = rndName();

    await createFile(`${noteName0}.md`, `[[${noteName1}]]`);
    await createFile(`${noteName1}.md`);

    const doc = await openTextDocument(`${noteName0}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toHaveLength(1);
    expect(toPlainObject(links[0])).toMatchObject({
      range: [
        {
          line: 0,
          character: expect.any(Number),
        },
        {
          line: 0,
          character: expect.any(Number),
        },
      ],
      target: {
        $mid: 1,
        path: '_memo.openDocumentByReference',
        scheme: 'command',
        query: `{"reference":"${noteName1}"}`,
      },
      tooltip: 'Follow link',
    });
  });

  it('should provide link to existing image', async () => {
    const noteName = rndName();
    const imageName = rndName();

    await createFile(`${noteName}.md`, `![[${imageName}.png]]`);
    await createFile(`${imageName}.png`);

    const doc = await openTextDocument(`${noteName}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toHaveLength(1);
    expect(toPlainObject(links[0])).toMatchObject({
      range: [
        {
          line: 0,
          character: expect.any(Number),
        },
        {
          line: 0,
          character: expect.any(Number),
        },
      ],
      target: {
        $mid: 1,
        path: '_memo.openDocumentByReference',
        scheme: 'command',
        query: `{"reference":"${imageName}.png"}`,
      },
      tooltip: 'Follow link',
    });
  });

  it('should provide nothing for link within code span', async () => {
    const noteName0 = rndName();
    const noteName1 = rndName();

    await createFile(`${noteName0}.md`, `\`[[${noteName1}]]\``);
    await createFile(`${noteName1}.md`);

    const doc = await openTextDocument(`${noteName0}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toHaveLength(0);
  });

  it('should provide nothing for link within fenced code block', async () => {
    const noteName0 = rndName();
    const noteName1 = rndName();

    await createFile(
      `${noteName0}.md`,
      `
    \`\`\`
    Preceding text
    [[1234512345]]
    Following text
    \`\`\`
    `,
    );
    await createFile(`${noteName1}.md`);

    const doc = await openTextDocument(`${noteName0}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toHaveLength(0);
  });

  it('should provide reference only for last link in the file', async () => {
    const noteName0 = rndName();

    await createFile(
      `${noteName0}.md`,
      `
    To create a link to any resource you can use \`[[DemoNote]]\` notation and for embedding resource to show it in the built-in preview (only images supported at the moment) please use \`![[]]\` notation with \`!\` in the beginning.

    \`[[DemoNote]]\` \`[[DemoNote]] [[DemoNote]]\`

    \`\`\`
    [[DemoNote]]
    \`\`\`

    [[DemoNote]]
    `,
    );

    const doc = await openTextDocument(`${noteName0}.md`);

    const linkProvider = new DocumentLinkProvider();

    const links = linkProvider.provideDocumentLinks(doc);

    expect(links).toMatchInlineSnapshot(`
      Array [
        se {
          "range": Array [
            Object {
              "character": 6,
              "line": 9,
            },
            Object {
              "character": 14,
              "line": 9,
            },
          ],
          "target": Object {
            "$mid": 1,
            "path": "_memo.openDocumentByReference",
            "query": "{\\"reference\\":\\"DemoNote\\"}",
            "scheme": "command",
          },
          "tooltip": "Follow link",
        },
      ]
    `);
  });
});
