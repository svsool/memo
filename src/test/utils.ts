import rimraf from 'rimraf';
import path from 'path';
import { workspace, Uri, commands } from 'vscode';

import { getWorkspaceFolder } from '../utils';

export const cleanWorkspace = () => {
  const workspaceFolder = getWorkspaceFolder();

  if (workspaceFolder) {
    rimraf.sync(path.join(workspaceFolder, '*'));
  }
};

export const cacheWorkspace = async () => await commands.executeCommand('_memo.cacheWorkspace');

export const cleanWorkspaceCache = async () =>
  await commands.executeCommand('_memo.cleanWorkspaceCache');

export const createFile = async (filename: string, content: string = '') => {
  const workspaceFolder = getWorkspaceFolder();

  if (workspaceFolder) {
    await workspace.fs.writeFile(
      Uri.file(path.join(workspaceFolder, `${filename}`)),
      Buffer.from(content),
    );

    await cacheWorkspace();
  }
};

export const getOpenedFilenames = () =>
  workspace.textDocuments.map(({ uri: { fsPath } }) => path.basename(fsPath));

export const closeAllEditors = async () => {
  await commands.executeCommand('workbench.action.closeAllEditors');
};
