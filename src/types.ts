import { Uri } from 'vscode';

export type WorkspaceCache = { imageUris: Uri[]; markdownUris: Uri[] };

export type RefT = {
  label: string;
  ref: string;
};
