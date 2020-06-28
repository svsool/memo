import MarkdownIt from 'markdown-it';
import path from 'path';

import extendMarkdownIt from './extendMarkdownIt';
import {
  createFile,
  rndName,
  getWorkspaceFolder,
  cacheWorkspace,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('extendMarkdownIt contribution', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not do anything with empty string', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    expect(md.render('')).toBe('');
  });

  it('should render invalid link', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[invalid-link]]').replace(getWorkspaceFolder()!, '')).toMatchInlineSnapshot(`
      "<p><a data-invalid-ref style=\\"color: #cc0013; cursor: not-allowed;\\" title=\\"Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one.\\" href=\\"javascript:void(0)\\">invalid-link</a></p>
      "
    `);
  });

  it('should render link to existing note without label', async () => {
    const name = rndName();
    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[${name}]]`)).toBe(
      `<p><a title="${name}" href="${path.join(getWorkspaceFolder()!, name)}.md">${name}</a></p>\n`,
    );
  });

  it('should render link to existing note with label', async () => {
    const name = rndName();
    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[${name}|Test Label]]`)).toBe(
      `<p><a title="Test Label" href="${path.join(
        getWorkspaceFolder()!,
        `${name}.md`,
      )}">Test Label</a></p>\n`,
    );
  });

  it('should render link to existing image', async () => {
    const name = rndName();
    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`![[${name}.png]]`)).toBe(
      `<p><div><img src="${path.join(
        getWorkspaceFolder()!,
        `${name}.png`,
      )}" alt="${name}.png" /></div></p>\n`,
    );
  });

  it('should not identify broken link', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[]]')).toBe('<p>[[]]</p>\n');
  });

  it('should render link to document even when brackets unbalanced', async () => {
    const name = rndName();
    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[[[${name}]]]]]]`)).toBe(
      `<p>[[<a title="${name}" href="${path.join(
        getWorkspaceFolder()!,
        name,
      )}.md">${name}</a>]]]]</p>\n`,
    );
  });

  it('should embed image even when brackets unbalanced', async () => {
    const name = rndName();
    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[![[${name}.png]]]]]]`)).toBe(
      `<p>[[<div><img src="${path.join(
        getWorkspaceFolder()!,
        `${name}.png`,
      )}" alt="${name}.png" /></div>]]]]</p>\n`,
    );
  });
});
