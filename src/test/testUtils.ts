import rimraf from 'rimraf';
import path from 'path';
import { workspace, Uri, commands } from 'vscode';
export { default as waitForExpect } from 'wait-for-expect';

import * as utils from '../utils';
import { WorkspaceCache } from '../types';

const { getWorkspaceFolder } = utils;

export { getWorkspaceFolder };

export const cleanWorkspace = () => {
  const workspaceFolder = utils.getWorkspaceFolder();

  if (workspaceFolder) {
    rimraf.sync(path.join(workspaceFolder, '*'));
  }
};

export const cacheWorkspace = async () => {
  await utils.cacheWorkspace();
  await commands.executeCommand('_memo.cacheWorkspace');
};

export const cleanWorkspaceCache = async () => {
  await utils.cleanWorkspaceCache();
  await commands.executeCommand('_memo.cleanWorkspaceCache');
};

export const createFile = async (
  filename: string,
  content: string = '',
  syncCache: boolean = true,
): Promise<Uri | undefined> => {
  const workspaceFolder = utils.getWorkspaceFolder();

  if (!workspaceFolder) {
    return;
  }

  await workspace.fs.writeFile(
    Uri.file(path.join(workspaceFolder, ...filename.split('/'))),
    Buffer.from(content),
  );

  if (syncCache) {
    await cacheWorkspace();
  }

  return Uri.file(path.join(workspaceFolder, ...filename.split('/')));
};

export const removeFile = async (filename: string) =>
  await workspace.fs.delete(
    Uri.file(path.join(utils.getWorkspaceFolder()!, ...filename.split('/'))),
  );

export const rndName = (): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 10);
};

export const openTextDocument = async (filename: string) =>
  await workspace.openTextDocument(path.join(utils.getWorkspaceFolder()!, filename));

export const getOpenedFilenames = () =>
  workspace.textDocuments.map(({ uri: { fsPath } }) => path.basename(fsPath));

export const getOpenedPaths = () => workspace.textDocuments.map(({ uri: { fsPath } }) => fsPath);

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const closeAllEditors = async () => {
  await commands.executeCommand('workbench.action.closeAllEditors');
  await delay(100);
};

export const closeEditorsAndCleanWorkspace = async () => {
  await closeAllEditors();
  cleanWorkspace();
  await cleanWorkspaceCache();
};

export const getWorkspaceCache = async (): Promise<WorkspaceCache> =>
  (await commands.executeCommand('_memo.getWorkspaceCache')) as WorkspaceCache;

export const toPlainObject = (value: unknown) => JSON.parse(JSON.stringify(value));
