import fs from 'fs';

import { createFile, rndName, cleanWorkspace, closeEditorsAndCleanWorkspace } from './utils';

describe('cleanWorkspace()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should clean workspace after adding a new file', async () => {
    const uri = await createFile(`${rndName()}.md`);

    expect(fs.existsSync(uri!.fsPath)).toBe(true);

    await cleanWorkspace();

    expect(fs.existsSync(uri!.fsPath)).toBe(false);
  });
});
