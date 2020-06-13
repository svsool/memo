import openTextDocument from './openTextDocument';
import { cleanWorkspace, createFile, getOpenedFilenames, closeAllEditors } from '../test/utils';

describe('openTextDocument command', () => {
  beforeEach(async () => {
    await closeAllEditors();
  });

  afterEach(async () => {
    cleanWorkspace();
    await closeAllEditors();
  });

  it('should open text document', async () => {
    const fileName = 'memo-note.md';

    await createFile(fileName);

    await openTextDocument({ reference: 'memo-note' });

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe(fileName);
  });

  it('should create new text document if one does not exist', async () => {
    expect(getOpenedFilenames()).toHaveLength(0);

    await openTextDocument({ reference: 'memo-note' });

    const openedFilenames = getOpenedFilenames();

    expect(openedFilenames).toHaveLength(1);
    expect(openedFilenames[0]).toBe('memo-note.md');
  });
});
