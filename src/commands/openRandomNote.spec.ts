import openRandomNote from './openRandomNote';
import {
  createFile,
  rndName,
  getOpenedFilenames,
  closeEditorsAndCleanWorkspace,
} from '../test/testUtils';

describe('openRandomNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should open random note', async () => {
    const filenames = [`${rndName()}.md`, `${rndName()}.md`, `${rndName()}.md`];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await openRandomNote();

    expect(getOpenedFilenames().some((filename) => filenames.includes(filename))).toBe(true);
  });

  it('opens all random notes', async () => {
    const filenames = [`${rndName()}.md`, `${rndName()}.md`, `${rndName()}.md`];

    await Promise.all(filenames.map((filename) => createFile(filename)));

    await openRandomNote();
    await openRandomNote();
    await openRandomNote();

    expect(getOpenedFilenames()).toEqual(expect.arrayContaining(filenames));
  });

  it('should open existing note only once on executing command multiple times', async () => {
    const filename = `${rndName()}.md`;

    await createFile(filename);

    await openRandomNote();
    await openRandomNote();
    await openRandomNote();

    expect(getOpenedFilenames()).toContain(filename);
  });
});
