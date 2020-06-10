import { workspace, Uri } from 'vscode';
import path from 'path';

const allExtsRegex = /\.(md|png|jpg|jpeg|svg|gif)$/;

const markdownExtRegex = /\.md$/;

const imageExtsRegex = /\.(png|jpg|jpeg|svg|gif)$/;

export const containsImageExt = (path: string): boolean => !!imageExtsRegex.exec(path);

export const containsMarkdownExt = (path: string): boolean => !!markdownExtRegex.exec(path);

export const trimLeadingSlash = (value: string) => value.replace(/^\/+|^\\+/g, '');

export const extractLongRef = (
  basePathParam: string,
  pathParam: string,
  preserveExtension?: boolean,
): string | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = pathParam.replace(basePathParam, '');

    if (preserveExtension) {
      return trimLeadingSlash(ref);
    }

    return trimLeadingSlash(ref.replace(allExtsRegex, ''));
  }

  return null;
};

export const extractShortRef = (pathParam: string, preserveExtension?: boolean): string | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = path.basename(pathParam);

    if (preserveExtension) {
      return trimLeadingSlash(ref);
    }

    return trimLeadingSlash(ref.replace(allExtsRegex, ''));
  }

  return null;
};

let imageUris: Uri[] = [];

let markdownUris: Uri[] = [];

export const getImageUris = () => imageUris;

export const getMarkdownUris = () => markdownUris;

export const cacheWorkspaceUris = async () => {
  imageUris = await workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  markdownUris = await workspace.findFiles('**/*.md');
};

export const cleanWorkspaceCache = () => {
  imageUris = [];
  markdownUris = [];
};

export const getWorkspaceFolder = () =>
  workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;
