import { window } from 'vscode';

import { getDecorations } from './syntaxDecorations';
import {
  createFile,
  rndName,
  openTextDocument,
  closeEditorsAndCleanWorkspace,
  updateMemoConfigProperty,
} from '../test/testUtils';

describe('getDecorations', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should return no decorations for empty editor', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename);

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [],
        "lightBlue": Array [],
      }
    `);
  });

  it('should return no decorations when decorations are disabled', async () => {
    const noteFilename = `${rndName()}.md`;

    await updateMemoConfigProperty('syntaxDecorations.enable', false);
    await createFile(noteFilename, '[[1234512345]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [],
        "lightBlue": Array [],
      }
    `);
  });

  it('should get ref decorations', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '[[1234512345]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [
          Array [
            Object {
              "character": 0,
              "line": 0,
            },
            Object {
              "character": 2,
              "line": 0,
            },
          ],
          Array [
            Object {
              "character": 12,
              "line": 0,
            },
            Object {
              "character": 14,
              "line": 0,
            },
          ],
        ],
        "lightBlue": Array [
          Array [
            Object {
              "character": 2,
              "line": 0,
            },
            Object {
              "character": 12,
              "line": 0,
            },
          ],
        ],
      }
    `);
  });

  it('should get ref decorations with ambiguous brackets', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '[[[[1234512345]]]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [
          Array [
            Object {
              "character": 2,
              "line": 0,
            },
            Object {
              "character": 4,
              "line": 0,
            },
          ],
          Array [
            Object {
              "character": 14,
              "line": 0,
            },
            Object {
              "character": 16,
              "line": 0,
            },
          ],
        ],
        "lightBlue": Array [
          Array [
            Object {
              "character": 4,
              "line": 0,
            },
            Object {
              "character": 14,
              "line": 0,
            },
          ],
        ],
      }
    `);
  });

  it('should return no decorations for invalid ref', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '[[[[]]]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [],
        "lightBlue": Array [],
      }
    `);
  });

  it('should return decorations for ref even when brackets are unbalanced', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '[[[[1234512345]]]]]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [
          Array [
            Object {
              "character": 2,
              "line": 0,
            },
            Object {
              "character": 4,
              "line": 0,
            },
          ],
          Array [
            Object {
              "character": 14,
              "line": 0,
            },
            Object {
              "character": 16,
              "line": 0,
            },
          ],
        ],
        "lightBlue": Array [
          Array [
            Object {
              "character": 4,
              "line": 0,
            },
            Object {
              "character": 14,
              "line": 0,
            },
          ],
        ],
      }
    `);
  });

  it('should return decorations for image ref', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '![[12345.png]]');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [
          Array [
            Object {
              "character": 1,
              "line": 0,
            },
            Object {
              "character": 3,
              "line": 0,
            },
          ],
          Array [
            Object {
              "character": 12,
              "line": 0,
            },
            Object {
              "character": 14,
              "line": 0,
            },
          ],
        ],
        "lightBlue": Array [
          Array [
            Object {
              "character": 3,
              "line": 0,
            },
            Object {
              "character": 12,
              "line": 0,
            },
          ],
        ],
      }
    `);
  });

  it('should not color ref within code span', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(noteFilename, '`[[1234512345]]`');

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [],
        "lightBlue": Array [],
      }
    `);
  });

  it('should not color ref within fenced code block', async () => {
    const noteFilename = `${rndName()}.md`;

    await createFile(
      noteFilename,
      `
    \`\`\`
    Preceding text
    [[1234512345]]
    Following text
    \`\`\`
    `,
    );

    const doc = await openTextDocument(noteFilename);

    const editor = await window.showTextDocument(doc);

    expect(getDecorations(editor)).toMatchInlineSnapshot(`
      Object {
        "gray": Array [],
        "lightBlue": Array [],
      }
    `);
  });
});
