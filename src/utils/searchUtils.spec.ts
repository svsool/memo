import { search, refsToSearchRegExpStr } from './searchUtils';
import {
  closeEditorsAndCleanWorkspace,
  createFile,
  getWorkspaceFolder,
  rndName,
} from '../test/utils';

describe('search()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should find regular ref', async () => {
    const name = rndName();

    const uri = await createFile(`${name}.md`, '[[ref]]');

    const [path] = await search(refsToSearchRegExpStr(['[[ref]]']), getWorkspaceFolder());

    expect(uri?.fsPath).toBe(path);
  });

  it('should find image ref', async () => {
    const name = rndName();

    const uri = await createFile(`${name}.md`, '[[image.png]]');

    const [path] = await search(refsToSearchRegExpStr(['[[image.png]]']), getWorkspaceFolder());

    expect(uri?.fsPath).toBe(path);
  });

  it('should find embedded image ref', async () => {
    const name = rndName();

    const uri = await createFile(`${name}.md`, '![[image.png]]');

    const [path] = await search(refsToSearchRegExpStr(['[[image.png]]']), getWorkspaceFolder());

    expect(uri?.fsPath).toBe(path);
  });

  it('should find ref in multiline file', async () => {
    const name0 = rndName();
    const name1 = rndName();

    const uri = await createFile(
      `${name0}.md`,
      `
    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
    [[ref]] [[ref]] [[ref]]
    Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    `,
    );

    await createFile(`${name1}.md`);

    const paths = await search(refsToSearchRegExpStr(['[[ref]]']), getWorkspaceFolder());

    expect(paths.length).toBe(1);
    expect(uri?.fsPath).toBe(paths[0]);
  });

  it('should not search inside non-md files', async () => {
    const name = rndName();

    await createFile(`${name}.txt`, '[[ref]]');

    const paths = await search(refsToSearchRegExpStr(['[[ref]]']), getWorkspaceFolder());

    expect(paths.length).toBe(0);
  });

  it('should find multiple refs', async () => {
    const name = rndName();

    await createFile(`${name}-1.md`, '[[ref0]]');
    await createFile(`${name}-2.md`, '[[ref1]]');

    const paths = await search(
      refsToSearchRegExpStr(['[[ref0]]', '[[ref1]]']),
      getWorkspaceFolder(),
    );

    expect(paths.length).toBe(2);
  });
});
