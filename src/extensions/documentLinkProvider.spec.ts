import DocumentLinkProvider from './documentLinkProvider';
import {
  createFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

const toPlainObject = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('documentLinkProvider extension', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not return anything for empty document', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename);

    const doc = await openTextDocument(filename);

    const linkProvider = new DocumentLinkProvider();

    expect(linkProvider.provideDocumentLinks(doc)).toHaveLength(0);
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
});
