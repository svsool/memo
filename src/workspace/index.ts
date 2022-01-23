import { cacheWorkspace, getWorkspaceCache, cleanWorkspaceCache } from './cache';

export * as fileWatcher from './file-watcher';

// public cache interface
export const cache = {
  cacheWorkspace,
  getWorkspaceCache,
  cleanWorkspaceCache,
};
