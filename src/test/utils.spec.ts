import fs from 'fs';
import path from 'path';

import { cleanWorkspace } from './utils';
import { getWorkspaceFolder } from '../utils';

describe('cleanWorkspace()', function () {
  it('should clean workspace after adding a new file', () => {
    const filePath = path.join(getWorkspaceFolder()!, 'memo-note.md');

    fs.writeFileSync(filePath, '# Hello world');

    expect(fs.existsSync(filePath)).toBe(true);

    cleanWorkspace();

    expect(fs.existsSync(filePath)).toBe(false);
  });
});
