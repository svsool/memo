import { Uri, Location, CompletionItem } from 'vscode';

export type WorkspaceCache = {
  imageUris: Uri[];
  markdownUris: Uri[];
  otherUris: Uri[];
  allUris: Uri[];
  danglingRefs: string[];
  danglingRefsByFsPath: { [key: string]: string[] };
  docsCompletionItems: CompletionItem[];
  resourcesCompletionItems: CompletionItem[];
  refsCompletionItems: CompletionItem[];
};

export type RefT = {
  label: string;
  ref: string;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
};

export type LinkRuleT = {
  rule: string;
  comment?: string;
  folder: string;
};
