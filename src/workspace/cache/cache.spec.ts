import path from 'path';
import { Uri } from 'vscode';

import {
  cacheWorkspace,
  cacheUris,
  cacheRefs,
  addCachedRefs,
  removeCachedRefs,
  getWorkspaceCache,
  cleanWorkspaceCache,
} from './cache';
import { getWorkspaceFolder } from '../../utils';
import {
  cleanWorkspace,
  closeEditorsAndCleanWorkspace,
  createFile,
  rndName,
} from '../../test/utils';

describe('cacheWorkspace()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheWorkspace();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should cache workspace', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;
    const otherFilename = `${rndName()}.txt`;

    await createFile(
      noteFilename,
      `
    [[dangling-ref]]
    [[dangling-ref]]
    [[dangling-ref2|Test Label]]
    [[folder1/long-dangling-ref]]
    ![[dangling-ref3]]
    \`[[dangling-ref-within-code-span]]\`
    \`\`\`
    Preceding text
    [[dangling-ref-within-fenced-code-block]]
    Following text
    \`\`\`
    [[${imageFilename}]]
    `,
      false,
    );
    await createFile(imageFilename, '', false);
    await createFile(otherFilename, '', false);

    await cacheWorkspace();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);
  });
});

describe('cacheUris()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheUris();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should cache uris', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;
    const otherFilename = `${rndName()}.txt`;

    await createFile(noteFilename, ``, false);
    await createFile(imageFilename, '', false);
    await createFile(otherFilename, '', false);

    await cacheUris();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);
  });
});

describe('cacheRefs()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cacheRefs();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });

  it('should cache refs', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(
      noteFilename,
      `
    [[dangling-ref]]
    [[dangling-ref]]
    [[dangling-ref2|Test Label]]
    [[folder1/long-dangling-ref]]
    ![[dangling-ref3]]
    \`[[dangling-ref-within-code-span]]\`
    \`\`\`
    Preceding text
    [[dangling-ref-within-fenced-code-block]]
    Following text
    \`\`\`
    [[${imageFilename}]]
    `,
    );
    await createFile(imageFilename);

    await cacheRefs();

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);

    cleanWorkspaceCache();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });
});

describe('addCachedRefs', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail without parameters', () => {
    expect(addCachedRefs([])).resolves.toBeUndefined();
  });

  it('should not fail with non-existing uri', () => {
    expect(addCachedRefs([Uri.file('/unknown')])).resolves.toBeUndefined();
  });

  it('should add cached refs', async () => {
    const name = rndName();

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);
  });

  it('should add cached refs on top of existing', async () => {
    const name = rndName();

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);

    await createFile(`${name}.md`, '[[dangling-ref]] [[dangling-ref2]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref', 'dangling-ref2']);
  });
});

describe('removeCachedRefs()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail with non-existing uri', () => {
    expect(() => removeCachedRefs([])).not.toThrow();
  });

  it('should not fail if there is nothing to remove', () => {
    expect(() => removeCachedRefs([Uri.file('/unknown')])).not.toThrow();
  });

  it('should remove cached refs', async () => {
    const name = rndName();

    await createFile(`${name}.md`, '[[dangling-ref]]');

    await addCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([['dangling-ref']]);
    expect(getWorkspaceCache().danglingRefs).toEqual(['dangling-ref']);

    await removeCachedRefs([Uri.file(path.join(getWorkspaceFolder()!, `${name}.md`))]);

    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });
});

describe('cleanWorkspaceCache()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', async () => {
    await cleanWorkspaceCache();

    expect([
      ...getWorkspaceCache().markdownUris,
      ...getWorkspaceCache().imageUris,
      ...getWorkspaceCache().otherUris,
    ]).toHaveLength(0);
  });

  it('should clean workspace cache', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;
    const otherFilename = `${rndName()}.txt`;

    await createFile(
      noteFilename,
      `
    [[dangling-ref]]
    [[dangling-ref]]
    [[dangling-ref2|Test Label]]
    [[folder1/long-dangling-ref]]
    ![[dangling-ref3]]
    \`[[dangling-ref-within-code-span]]\`
    \`\`\`
    Preceding text
    [[dangling-ref-within-fenced-code-block]]
    Following text
    \`\`\`
    [[${imageFilename}]]
    `,
    );
    await createFile(imageFilename);
    await createFile(otherFilename);

    await cacheWorkspace();

    expect(
      [
        ...getWorkspaceCache().markdownUris,
        ...getWorkspaceCache().imageUris,
        ...getWorkspaceCache().otherUris,
      ].map(({ fsPath }) => path.basename(fsPath)),
    ).toEqual([noteFilename, imageFilename, otherFilename]);

    expect(Object.values(getWorkspaceCache().danglingRefsByFsPath)).toEqual([
      ['dangling-ref', 'dangling-ref2', 'folder1/long-dangling-ref', 'dangling-ref3'],
    ]);
    expect(getWorkspaceCache().danglingRefs).toEqual([
      'dangling-ref',
      'dangling-ref2',
      'dangling-ref3',
      'folder1/long-dangling-ref',
    ]);

    cleanWorkspaceCache();

    expect([
      ...getWorkspaceCache().markdownUris,
      ...getWorkspaceCache().imageUris,
      ...getWorkspaceCache().otherUris,
    ]).toHaveLength(0);
    expect(getWorkspaceCache().danglingRefsByFsPath).toEqual({});
    expect(getWorkspaceCache().danglingRefs).toEqual([]);
  });
});

describe('getWorkspaceCache()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should work with empty workspace', () => {
    cleanWorkspace();
    cleanWorkspaceCache();

    expect([...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris]).toHaveLength(0);
  });

  it('should get workspace cache', async () => {
    const noteFilename = `${rndName()}.md`;
    const imageFilename = `${rndName()}.png`;

    await createFile(noteFilename);
    await createFile(imageFilename);

    await cacheWorkspace();

    const uris = [...getWorkspaceCache().markdownUris, ...getWorkspaceCache().imageUris];

    expect(uris).toHaveLength(2);
    expect(uris.map(({ fsPath }) => path.basename(fsPath))).toEqual([noteFilename, imageFilename]);
  });
});
