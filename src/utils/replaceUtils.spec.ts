import { workspace } from 'vscode';

import { replaceRefsInDoc } from './replaceUtils';

describe('replaceRefsInDoc()', () => {
  it('should return null if nothing to replace', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[some-ref]]',
        }),
      ),
    ).toBe(null);
  });

  it('should replace short ref with short ref', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref]]',
        }),
      ),
    ).toBe('[[new-test-ref]]');
  });

  it('should replace short ref with label with short ref with label', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref|Test Label]]',
        }),
      ),
    ).toBe('[[new-test-ref|Test Label]]');
  });

  it('should replace long ref with long ref', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      ),
    ).toBe('[[folder1/new-test-ref]]');
  });

  it('should replace long ref with long ref', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      ),
    ).toBe('[[folder1/new-test-ref]]');
  });

  it('should replace long ref + label with long ref + label', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref|Test Label]]',
        }),
      ),
    ).toBe('[[folder1/new-test-ref|Test Label]]');
  });

  it('should replace long ref + label with short ref + label', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref|Test Label]]',
        }),
      ),
    ).toBe('[[new-test-ref|Test Label]]');
  });

  it('should replace short ref + label with long ref + label', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref', new: 'folder1/new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref|Test Label]]',
        }),
      ),
    ).toBe('[[folder1/new-test-ref|Test Label]]');
  });

  it('should replace short ref with short ref with unknown extension', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref', new: 'new-test-ref.unknown' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref]]',
        }),
      ),
    ).toBe('[[new-test-ref.unknown]]');
  });

  it('should replace short ref with unknown extension with short ref ', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'test-ref.unknown', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref.unknown]]',
        }),
      ),
    ).toBe('[[new-test-ref]]');
  });

  it('should replace long ref with short ref with unknown extension', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref', new: 'new-test-ref.unknown' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref]]',
        }),
      ),
    ).toBe('[[new-test-ref.unknown]]');
  });

  it('should replace long ref with unknown extension with short ref ', async () => {
    expect(
      replaceRefsInDoc(
        [{ old: 'folder1/test-ref.unknown', new: 'new-test-ref' }],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[folder1/test-ref.unknown]]',
        }),
      ),
    ).toBe('[[new-test-ref]]');
  });

  it('should not replace ref within code span', async () => {
    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: '`[[test-ref]]`',
    });

    expect(replaceRefsInDoc([{ old: 'test-ref', new: 'new-test-ref' }], doc)).toBe(
      '`[[test-ref]]`',
    );
  });

  it('should not replace ref within code span 2', async () => {
    const content = `
    Preceding text
    \`[[test-ref]]\`
    Following text
    `;
    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: content,
    });

    expect(replaceRefsInDoc([{ old: 'test-ref', new: 'new-test-ref' }], doc)).toBe(content);
  });

  it('should not replace ref within fenced code block', async () => {
    const initialContent = `
    \`\`\`
    Preceding text
    [[test-ref]]
    Following text
    \`\`\`
    `;

    const doc = await workspace.openTextDocument({
      language: 'markdown',
      content: initialContent,
    });

    expect(replaceRefsInDoc([{ old: 'test-ref', new: 'new-test-ref' }], doc)).toBe(initialContent);
  });

  it('should replace multiple links at once', async () => {
    expect(
      replaceRefsInDoc(
        [
          { old: 'test-ref', new: 'folder2/new-test-ref' },
          { old: 'folder1/test-ref', new: 'folder2/new-test-ref' },
        ],
        await workspace.openTextDocument({
          language: 'markdown',
          content: '[[test-ref]] [[folder1/test-ref|Test Label]]',
        }),
      ),
    ).toBe('[[folder2/new-test-ref]] [[folder2/new-test-ref|Test Label]]');
  });
});
