import { sort as sortPaths } from 'cross-path-sort';
import vscode from 'vscode';

import { WorkspaceCache } from '../../types';

const workspaceCache: WorkspaceCache = {
  imageUris: [],
  markdownUris: [],
  otherUris: [],
  allUris: [],
  danglingRefsByFsPath: {},
  danglingRefs: [],
};

// lazy require avoids cyclic dependencies between utils and cache
const utils = () => require('../../utils');

// private methods (not exported via workspace/index.ts and should not be used outside of workspace folder)

export const cacheRefs = async () => {
  const { search, getWorkspaceFolder } = utils();

  const workspaceFolder = getWorkspaceFolder();

  const fsPaths = workspaceFolder ? await search('\\[\\[([^\\[\\]]+?)\\]\\]', workspaceFolder) : [];

  const searchUris = fsPaths.length
    ? workspaceCache.markdownUris.filter(({ fsPath }) => fsPaths.includes(fsPath))
    : workspaceCache.markdownUris;

  workspaceCache.danglingRefsByFsPath = await utils().findDanglingRefsByFsPath(searchUris);
  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );
};

export const addCachedRefs = async (uris: vscode.Uri[]) => {
  const danglingRefsByFsPath = await utils().findDanglingRefsByFsPath(uris);

  workspaceCache.danglingRefsByFsPath = {
    ...workspaceCache.danglingRefsByFsPath,
    ...danglingRefsByFsPath,
  };

  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );
};

export const removeCachedRefs = async (uris: vscode.Uri[]) => {
  const fsPaths = uris.map(({ fsPath }) => fsPath);

  workspaceCache.danglingRefsByFsPath = Object.entries(workspaceCache.danglingRefsByFsPath).reduce<{
    [key: string]: string[];
  }>((refsByFsPath, [fsPath, refs]) => {
    if (fsPaths.some((p) => fsPath.startsWith(p))) {
      return refsByFsPath;
    }

    refsByFsPath[fsPath] = refs;

    return refsByFsPath;
  }, {});

  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );
};

// public methods (exported via workspace/index.ts)

export const getWorkspaceCache = (): WorkspaceCache => workspaceCache;

export const cacheWorkspace = async () => {
  await cacheUris();
  await cacheRefs();
};

export const cleanWorkspaceCache = () => {
  workspaceCache.imageUris = [];
  workspaceCache.markdownUris = [];
  workspaceCache.otherUris = [];
  workspaceCache.allUris = [];
  workspaceCache.danglingRefsByFsPath = {};
  workspaceCache.danglingRefs = [];
};

export const cacheUris = async () => {
  const { findNonIgnoredFiles, imageExts, otherExts } = utils();
  const markdownUris = await findNonIgnoredFiles('**/*.md');
  const imageUris = await findNonIgnoredFiles(`**/*.{${imageExts.join(',')}}`);
  const otherUris = await findNonIgnoredFiles(`**/*.{${otherExts.join(',')}}`);

  workspaceCache.markdownUris = sortPaths(markdownUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.imageUris = sortPaths(imageUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.otherUris = sortPaths(otherUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.allUris = sortPaths([...markdownUris, ...imageUris, ...otherUris], {
    pathKey: 'path',
    shallowFirst: true,
  });
};
