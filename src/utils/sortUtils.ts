import * as vscode from 'vscode';

import { _sortPaths, GetMTimeOfFile } from './sortUtils.pure';

const getMTimeOfFile: GetMTimeOfFile = async (uri: vscode.Uri) => {
  const stat = await vscode.workspace.fs.stat(uri);
  return stat.mtime;
};
export const sortPaths = _sortPaths(getMTimeOfFile, vscode.Uri.file);
