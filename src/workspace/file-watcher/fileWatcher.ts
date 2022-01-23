import { workspace, ExtensionContext } from 'vscode';
import debounce from 'lodash.debounce';

import { handleFileCreate, handleFileDelete, handleDocChange, handleFilesRename } from './handlers';
import { cacheUris } from '../../utils';

export const activate = (
  context: ExtensionContext,
  options: { uriCachingDelay?: number; documentChangeDelay?: number } = {},
) => {
  const { uriCachingDelay = 1000, documentChangeDelay = 500 } = options;

  const cacheUrisDebounced = debounce(cacheUris, uriCachingDelay);
  const handleDocChangeDebounced = debounce(handleDocChange, documentChangeDelay);

  const fileWatcher = workspace.createFileSystemWatcher('**/*');

  const createListenerDisposable = fileWatcher.onDidCreate((newUri) =>
    handleFileCreate(newUri, cacheUrisDebounced),
  );
  const deleteListenerDisposable = fileWatcher.onDidDelete((removedUri) =>
    handleFileDelete(removedUri, cacheUrisDebounced),
  );
  const changeTextDocumentDisposable = workspace.onDidChangeTextDocument(({ document }) =>
    handleDocChangeDebounced(document),
  );
  const renameFilesDisposable = workspace.onDidRenameFiles(handleFilesRename);

  context.subscriptions.push(
    createListenerDisposable,
    deleteListenerDisposable,
    renameFilesDisposable,
    changeTextDocumentDisposable,
  );

  return () => {
    cacheUrisDebounced.cancel();
    handleDocChangeDebounced.cancel();
  };
};
