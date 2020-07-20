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
  escapeForRegExp,
} from '../test/testUtils';

describe('extendMarkdownIt contribution', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not do anything with empty string', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    expect(md.render('')).toBe('');
  });

  it('should render html link with tooltip about broken reference to note', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[invalid-link]]').replace(getWorkspaceFolder()!, '')).toMatchInlineSnapshot(`
      "<p><a class=\\"memo-invalid-link\\" title=\\"Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one.\\" href=\\"javascript:void(0)\\">invalid-link</a></p>
      "
    `);
  });

  it('should render html link to the existing note without a label', async () => {
    const name = rndName();

    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    const url = getFileUrlForMarkdownPreview(notePath);

    expect(md.render(`[[${name}]]`)).toBe(`<p><a title="${url}" href="${url}">${name}</a></p>\n`);
  });

  it('should render html link to the existing note with a label', async () => {
    const name = rndName();

    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const notePath = `${path.join(getWorkspaceFolder()!, `${name}.md`)}`;

    const url = getFileUrlForMarkdownPreview(notePath);

    expect(md.render(`[[${name}|Test Label]]`)).toBe(
      `<p><a title="${url}" href="${url}">Test Label</a></p>\n`,
    );
  });

  it('should render html link to the existing image without a label', async () => {
    const name = rndName();

    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const imagePath = `${path.join(getWorkspaceFolder()!, name)}.png`;

    const url = getFileUrlForMarkdownPreview(imagePath);

    expect(md.render(`[[${name}.png]]`)).toBe(
      `<p><a title="${url}" href="${url}">${name}.png</a></p>\n`,
    );
  });

  it('should render html link to the existing image with a label', async () => {
    const name = rndName();

    await createFile(`${name}.png`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    const imagePath = `${path.join(getWorkspaceFolder()!, name)}.png`;

    const url = getFileUrlForMarkdownPreview(imagePath);

    expect(md.render(`[[${name}.png|Test Label]]`)).toBe(
      `<p><a title="${url}" href="${url}">Test Label</a></p>\n`,
    );
  });

  it('should render html link with tooltip about broken reference to image', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[invalid-link.png]]').replace(getWorkspaceFolder()!, ''))
      .toMatchInlineSnapshot(`
      "<p><a class=\\"memo-invalid-link\\" title=\\"Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one.\\" href=\\"javascript:void(0)\\">invalid-link.png</a></p>
      "
    `);
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

    const url = getFileUrlForMarkdownPreview(notePath);

    expect(md.render(`[[[[${name}]]]]]]`)).toBe(
      `<p>[[<a title="${url}" href="${url}">${name}</a>]]]]</p>\n`,
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

    const url = getFileUrlForMarkdownPreview(notePath);

    expect(md.render(`[[${name}]]`)).toBe(`<p><a title="${url}" href="${url}">${name}</a></p>\n`);
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

    const url = getFileUrlForMarkdownPreview(notePath);

    expect(md.render(`[[${name}]]`)).toBe(`<p><a title="${url}" href="${url}">${name}</a></p>\n`);
  });

  it('should render embedded note', async () => {
    const name = rndName();

    await createFile(`${name}.md`, '# Hello world');

    const md = extendMarkdownIt(MarkdownIt());

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    const html = md.render(`![[${name}]]`);

    expect(
      html.replace(new RegExp(escapeForRegExp(notePath), 'g'), `/note.md`).replace(name, 'note'),
    ).toMatchInlineSnapshot(`
      "<p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note.md\\" href=\\"/note.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <h1>Hello world</h1>

                </div>
              </div></p>
      "
    `);
  });

  it('should render double embedded note', async () => {
    const name = rndName();
    const name1 = rndName();

    await createFile(`${name}.md`, '# Hello world');
    await createFile(`${name1}.md`, `![[${name}]]`);

    const md = extendMarkdownIt(MarkdownIt());

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;
    const notePath1 = `${path.join(getWorkspaceFolder()!, name1)}.md`;

    const html = md.render(`![[${name1}]]`);

    expect(
      html
        .replace(new RegExp(escapeForRegExp(notePath), 'g'), `/note.md`)
        .replace(name, 'note')
        .replace(new RegExp(escapeForRegExp(notePath1), 'g'), `/note1.md`)
        .replace(name1, 'note1'),
    ).toMatchInlineSnapshot(`
      "<p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note1</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note1.md\\" href=\\"/note1.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note.md\\" href=\\"/note.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <h1>Hello world</h1>

                </div>
              </div></p>

                </div>
              </div></p>
      "
    `);
  });

  it('should render cyclic linking detected warning', async () => {
    const name = rndName();

    await createFile(`${name}.md`, `![[${name}]]`);

    const md = extendMarkdownIt(MarkdownIt());

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;

    const html = md.render(`![[${name}]]`);

    expect(
      html.replace(new RegExp(escapeForRegExp(notePath), 'g'), `/note.md`).replace(name, 'note'),
    ).toMatchInlineSnapshot(`
      "<p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note.md\\" href=\\"/note.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <div style=\\"text-align: center\\">Cyclic linking detected 💥.</div>
                </div>
              </div></p>
      "
    `);
  });

  it('should render cyclic linking detected warning for deep link', async () => {
    const name = rndName();
    const name1 = rndName();

    await createFile(`${name}.md`, `![[${name1}]]`);
    await createFile(`${name1}.md`, `![[${name}]]`);

    const md = extendMarkdownIt(MarkdownIt());

    const notePath = `${path.join(getWorkspaceFolder()!, name)}.md`;
    const notePath1 = `${path.join(getWorkspaceFolder()!, name1)}.md`;

    const html = md.render(`![[${name}]]`);

    expect(
      html
        .replace(new RegExp(escapeForRegExp(notePath), 'g'), `/note.md`)
        .replace(name, 'note')
        .replace(new RegExp(escapeForRegExp(notePath1), 'g'), `/note1.md`)
        .replace(name1, 'note1'),
    ).toMatchInlineSnapshot(`
      "<p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note.md\\" href=\\"/note.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <p><div class=\\"memo-markdown-embed\\">
                <div class=\\"memo-markdown-embed-title\\">note1</div>
                <div class=\\"memo-markdown-embed-link\\">
                  <a title=\\"/note1.md\\" href=\\"/note1.md\\">
                    <i class=\\"icon-link\\"></i>
                  </a>
                </div>
                <div class=\\"memo-markdown-embed-content\\">
                  <div style=\\"text-align: center\\">Cyclic linking detected 💥.</div>
                </div>
              </div></p>

                </div>
              </div></p>
      "
    `);
  });
});
