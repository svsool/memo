import { workspace } from 'vscode';
import path from 'path';

import { WorkspaceCache, RefT } from '../types';

const allExtsRegex = /\.(md|png|jpg|jpeg|svg|gif)/;

const markdownExtRegex = /\.md$/;

const imageExtsRegex = /\.(png|jpg|jpeg|svg|gif)/;

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

export const extractShortRef = (pathParam: string, preserveExtension?: boolean): RefT | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = path.basename(pathParam);

    if (preserveExtension) {
      const [refStr, label = ''] = trimLeadingSlash(ref).split('|');

      return {
        ref: refStr,
        label,
      };
    }

    const refNoExts = trimLeadingSlash(ref.replace(allExtsRegex, ''));
    const [refStr, label = ''] = refNoExts.split('|');

    return {
      ref: refStr,
      label,
    };
  }

  return null;
};

const workspaceCache: WorkspaceCache = {
  imageUris: [],
  markdownUris: [],
};

export const getWorkspaceCache = (): WorkspaceCache => workspaceCache;

export const cacheWorkspace = async () => {
  workspaceCache.imageUris = await workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  workspaceCache.markdownUris = await workspace.findFiles('**/*.md');
};

export const cleanWorkspaceCache = () => {
  workspaceCache.imageUris = [];
  workspaceCache.markdownUris = [];
};

export const getWorkspaceFolder = () =>
  workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

export const getDateInYYYYMMDDFormat = () => new Date().toISOString().slice(0, 10);
