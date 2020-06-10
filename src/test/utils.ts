import rimraf from 'rimraf';
import path from 'path';
import fs from 'fs';

import { getWorkspaceFolder } from '../utils';

export const cleanWorkspace = () => {
  const workspaceFolder = getWorkspaceFolder();

  if (workspaceFolder) {
    rimraf.sync(path.join(workspaceFolder, '*'));
  }
};

export const createFile = (filename: string, content: string) => {
  const workspaceFolder = getWorkspaceFolder();

  if (workspaceFolder) {
    fs.writeFileSync(path.join(workspaceFolder, `${filename}`), content);
  }
};
