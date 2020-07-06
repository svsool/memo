import MarkdownIt from 'markdown-it';
import path from 'path';

import extendMarkdownIt from './extendMarkdownIt';
import {
  createFile,
  rndName,
  getWorkspaceFolder,
  cacheWorkspace,
  closeEditorsAndCleanWorkspace,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
} from '../test/testUtils';

describe('extendMarkdownIt contribution', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not do anything with empty string', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    expect(md.render('')).toBe('');
  });

  it('should render html link with tooltip about broken reference', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[invalid-link]]').replace(getWorkspaceFolder()!, '')).toMatchInlineSnapshot(`
      "<p><a data-invalid-ref style=\\"color: #cc0013; cursor: not-allowed;\\" title=\\"Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one.\\" href=\\"javascript:void(0)\\">invalid-link</a></p>
      "
    `);
  });

  it('should render html link to the existing note without a label', async () => {
    const name = rndName();

    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    expect(md.render(`[[${name}]]`)).toBe(
      `<p><a title="${name}" href="${getFileUrlForMarkdownPreview(notePath)}">${name}</a></p>\n`,
    );
  });

  it('should render html link to the existing note with a label', async () => {
    const name = rndName();

    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, `${name}.md`)}`;

    expect(md.render(`[[${name}|Test Label]]`)).toBe(
      `<p><a title="Test Label" href="${getFileUrlForMarkdownPreview(
        notePath,
      )}">Test Label</a></p>\n`,
    );
  });

  it('should render image', async () => {
    const name = rndName();

    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`![[${name}.png]]`)).toBe(
      `<p><div><img src="${getImgUrlForMarkdownPreview(
        path.join(getWorkspaceFolder()!, `${name}.png`),
      )}" alt="${name}.png" /></div></p>\n`,
    );
  });

  it('should not identify broken link', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[]]')).toBe('<p>[[]]</p>\n');
  });

  it('should render html link to the note even when brackets unbalanced', async () => {
    const name = rndName();

    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    expect(md.render(`[[[[${name}]]]]]]`)).toBe(
      `<p>[[<a title="${name}" href="${getFileUrlForMarkdownPreview(
        notePath,
      )}">${name}</a>]]]]</p>\n`,
    );
  });

  it('should render an image even when brackets unbalanced', async () => {
    const name = rndName();

    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[![[${name}.png]]]]]]`)).toBe(
      `<p>[[<div><img src="${getImgUrlForMarkdownPreview(
        path.join(getWorkspaceFolder()!, `${name}.png`),
      )}" alt="${name}.png" /></div>]]]]</p>\n`,
    );
  });

  it('should render proper html link to the note on partial match', async () => {
    const name = rndName();

    await createFile(`/a/first-${name}.md`);
    await createFile(`/b/${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, 'b', name)}.md`;

    expect(md.render(`[[${name}]]`)).toBe(
      `<p><a title="${name}" href="${getFileUrlForMarkdownPreview(notePath)}">${name}</a></p>\n`,
    );
  });

  it('should render html link to the note on short link without extension', async () => {
    const name = rndName();

    await createFile(`/a/${name}.gif`);
    await createFile(`/a/${name}.png`);
    await createFile(`/b/${name}.md`);
    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    expect(md.render(`[[${name}]]`)).toBe(
      `<p><a title="${name}" href="${getFileUrlForMarkdownPreview(notePath)}">${name}</a></p>\n`,
    );
  });
});
