import { Uri, Location } from 'vscode';

export type WorkspaceCache = { imageUris: Uri[]; markdownUris: Uri[] };

export type RefT = {
  label: string;
  ref: string;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
};
