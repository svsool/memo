import del from 'del';
import fs from 'fs';
import path from 'path';
import { workspace, Uri, commands, ConfigurationTarget } from 'vscode';
export { default as waitForExpect } from 'wait-for-expect';

import * as utils from '../utils';
import { WorkspaceCache } from '../types';

const {
  getWorkspaceFolder,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
  escapeForRegExp,
  getMemoConfigProperty,
} = utils;

export {
  getMemoConfigProperty,
  getWorkspaceFolder,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
  escapeForRegExp,
};

export const cleanWorkspace = () => {
  const workspaceFolder = utils.getWorkspaceFolder();

  if (workspaceFolder) {
    del.sync(['**/!(.vscode)'], {
      force: true,
      cwd: workspaceFolder,
    });
  }
};

export const cacheWorkspace = async () => {
  await utils.cacheWorkspace();
  await commands.executeCommand('_memo.cacheWorkspace');
};

export const cleanWorkspaceCache = async () => {
  utils.cleanWorkspaceCache();
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

  const filepath = path.join(workspaceFolder, ...filename.split('/'));
  const dirname = path.dirname(filepath);

  utils.ensureDirectoryExists(filepath);

  if (!fs.existsSync(dirname)) {
    throw new Error(`Directory ${dirname} does not exist`);
  }

  fs.writeFileSync(filepath, content);

  if (syncCache) {
    await cacheWorkspace();
  }

  return Uri.file(path.join(workspaceFolder, ...filename.split('/')));
};

export const createSymlink = async (
  filename: string,
  target: string,
  syncCache: boolean = true,
): Promise<Uri | undefined> => {
  const workspaceFolder = utils.getWorkspaceFolder();

  if (!workspaceFolder) {
    return;
  }

  const filepath = path.join(workspaceFolder, ...filename.split('/'));
  const dirname = path.dirname(filepath);
  const targetpath = path.join(workspaceFolder, ...target.split('/'));

  utils.ensureDirectoryExists(filepath);

  if (!fs.existsSync(dirname)) {
    throw new Error(`Directory ${dirname} does not exist`);
  }

  fs.symlinkSync(targetpath, filepath);

  if (syncCache) {
    await cacheWorkspace();
  }

  return Uri.file(path.join(workspaceFolder, ...filename.split('/')));
};

export const fileExists = (filename: string) => {
  const workspaceFolder = utils.getWorkspaceFolder();

  if (!workspaceFolder) {
    return;
  }

  const filepath = path.join(workspaceFolder, ...filename.split('/'));

  return fs.existsSync(filepath);
};

export const removeFile = (filename: string) =>
  fs.unlinkSync(path.join(utils.getWorkspaceFolder()!, ...filename.split('/')));

export const rndName = (): string => {
  const name = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);

  return name.length !== 5 ? rndName() : name;
};

export const openTextDocument = (filename: string) => {
  const filePath = path.join(utils.getWorkspaceFolder()!, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  return workspace.openTextDocument(filePath);
};

export const getOpenedFilenames = () =>
  workspace.textDocuments.map(({ uri: { fsPath } }) => path.basename(fsPath));

export const getOpenedPaths = () => workspace.textDocuments.map(({ uri: { fsPath } }) => fsPath);

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const closeAllEditors = async () => {
  await commands.executeCommand('workbench.action.closeAllEditors');
  await delay(100);
};

const getDefaultConfigProperties = (): {
  default?: any;
  scope?: string;
  description?: string;
  type?: string;
}[] => {
  return require('../../package.json').contributes.configuration.properties;
};

export const updateConfigProperty = async (
  property: string,
  value: unknown,
  target = ConfigurationTarget.Workspace,
) => {
  await workspace.getConfiguration().update(property, value, target);
};

export const updateMemoConfigProperty = async (property: string, value: unknown) =>
  await updateConfigProperty(`memo.${property}`, value);

const resetMemoConfigProps = async () =>
  await Promise.all(
    Object.entries(getDefaultConfigProperties()).map(([propName, propConfig]) =>
      propConfig.default !== undefined
        ? updateConfigProperty(propName, propConfig.default)
        : undefined,
    ),
  );

export const closeEditorsAndCleanWorkspace = async () => {
  await resetMemoConfigProps();
  await closeAllEditors();
  cleanWorkspace();
  await cleanWorkspaceCache();
};

export const getWorkspaceCache = async (): Promise<WorkspaceCache> =>
  (await commands.executeCommand('_memo.getWorkspaceCache')) as WorkspaceCache;

export const toPlainObject = <R>(value: unknown): R =>
  value !== undefined ? JSON.parse(JSON.stringify(value)) : value;
