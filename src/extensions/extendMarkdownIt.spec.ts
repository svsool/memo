import MarkdownIt from 'markdown-it';

import extendMarkdownIt from './extendMarkdownIt';
import { getWorkspaceFolder } from '../utils';
import {
  createFile,
  rndName,
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

  it('should detect invalid link', async () => {
    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render('[[invalid-link]]').replace(getWorkspaceFolder()!, '')).toMatchInlineSnapshot(`
      "<p><a data-invalid-ref style=\\"color: #cc0013; cursor: not-allowed;\\" title=\\"Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one.\\" href=\\"javascript:void(0)\\">invalid-link</a></p>
      "
    `);
  });

  it('should detect link to existing note', async () => {
    const name = rndName();
    await createFile(`${name}.md`);

    const md = extendMarkdownIt(MarkdownIt());

    await cacheWorkspace();

    expect(md.render(`[[${name}]]`).replace(getWorkspaceFolder()!, '')).toMatchInlineSnapshot(`
      "<p><a title=\\"${name}\\" href=\\"/${name}.md\\">${name}</a></p>
      "
    `);
  });
});
