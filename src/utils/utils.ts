import vscode, { workspace } from 'vscode';
import path from 'path';
import { sort as sortPaths } from 'cross-path-sort';
import fs from 'fs';

import getWordRangeAtPosition from './getWordRangeAtPosition';
import { WorkspaceCache, RefT, FoundRefT } from '../types';

export { sortPaths };

const allExtsRegex = /\.(md|png|jpg|jpeg|svg|gif)/i;

const markdownExtRegex = /\.md$/i;

const imageExtsRegex = /\.(png|jpg|jpeg|svg|gif)/i;

export const refPattern = '(\\[\\[)([^\\[\\]]+?)(\\]\\])';

export const containsImageExt = (path: string): boolean => !!imageExtsRegex.exec(path);

export const containsMarkdownExt = (path: string): boolean => !!markdownExtRegex.exec(path);

export const trimLeadingSlash = (value: string) => value.replace(/^\/+|^\\+/g, '');
export const trimTrailingSlash = (value: string) => value.replace(/\/+|^\\+$/g, '');
export const trimSlashes = (value: string) => trimLeadingSlash(trimTrailingSlash(value));

export const isLongRef = (path: string) => path.split('/').length > 1;

export const extractLongRef = (
  basePathParam: string,
  pathParam: string,
  preserveExtension?: boolean,
): RefT | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = pathParam.replace(basePathParam, '').replace(/\\/gi, '/');

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
  allUris: [],
};

export const getWorkspaceCache = (): WorkspaceCache => workspaceCache;

export const cacheWorkspace = async () => {
  const imageUris = await workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  const markdownUris = await workspace.findFiles('**/*.md');

  workspaceCache.imageUris = sortPaths(imageUris, { shallowFirst: true });
  workspaceCache.markdownUris = sortPaths(markdownUris, { shallowFirst: true });
  workspaceCache.allUris = sortPaths([...markdownUris, ...imageUris], { shallowFirst: true });
};

export const cleanWorkspaceCache = () => {
  workspaceCache.imageUris = [];
  workspaceCache.markdownUris = [];
  workspaceCache.allUris = [];
};

export const getWorkspaceFolder = () =>
  workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath;

export const getDateInYYYYMMDDFormat = () => new Date().toISOString().slice(0, 10);

const isEditor = (
  documentOrEditor: vscode.TextDocument | vscode.TextEditor,
): documentOrEditor is vscode.TextEditor =>
  'document' in documentOrEditor && documentOrEditor.document !== null;

export function getConfigProperty<T>(
  documentOrEditor: vscode.TextDocument | vscode.TextEditor,
  property: string,
  fallback: T,
): T {
  const document = isEditor(documentOrEditor) ? documentOrEditor.document : documentOrEditor;
  const config = vscode.workspace.getConfiguration('memo', document ? document.uri : undefined);
  return config.get(property.toLowerCase(), config.get(property, fallback));
}

export const matchAll = (pattern: RegExp, text: string): Array<RegExpMatchArray> => {
  const out: RegExpMatchArray[] = [];
  pattern.lastIndex = 0;
  let match: RegExpMatchArray | null;
  while ((match = pattern.exec(text))) {
    out.push(match);
  }
  return out;
};

export const getReferenceAtPosition = (
  document: vscode.TextDocument,
  position: vscode.Position,
): { range: vscode.Range; ref: string } | null => {
  const range = getWordRangeAtPosition(
    document.lineAt(position.line).text,
    position,
    new RegExp(refPattern),
  );

  if (!range) {
    return null;
  }

  const [ref] = document
    .getText(range)
    .replace('![[', '')
    .replace('[[', '')
    .replace(']]', '')
    .split('|');

  return {
    ref,
    range,
  };
};

export const findReferences = async (
  ref: string,
  excludePaths: string[] = [],
): Promise<FoundRefT[]> => {
  const refs: FoundRefT[] = [];

  for (const { fsPath } of workspaceCache.markdownUris) {
    if (excludePaths.includes(fsPath)) {
      continue;
    }

    const fileContent = fs.readFileSync(fsPath).toString();
    const matches = matchAll(new RegExp(`\\[\\[(${ref}(\\|.*)?)\\]\\]`, 'gi'), fileContent);

    if (matches.length) {
      const currentDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(fsPath));
      matches.forEach((match) => {
        const [, $1] = match;
        const offset = (match.index || 0) + 2;

        const refStart = currentDocument.positionAt(offset);
        const lineStart = currentDocument.lineAt(refStart);
        const matchText = lineStart.text.slice(
          Math.max(refStart.character - 2, 0),
          lineStart.text.length,
        );
        const refEnd = currentDocument.positionAt(offset + $1.length);

        refs.push({
          location: new vscode.Location(
            vscode.Uri.file(fsPath),
            new vscode.Range(refStart, refEnd),
          ),
          matchText: matchText,
        });
      });
    }
  }

  return refs;
};

export const getFileUrlForMarkdownPreview = (filePath: string): string =>
  vscode.Uri.file(filePath).toString().replace('file:', '');

export const getImgUrlForMarkdownPreview = (imagePath: string): string =>
  `vscode-resource://${vscode.Uri.file(imagePath).toString().replace('file:', 'file')}`;

const uncPathRegex = /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/;

export const isUncPath = (path: string): boolean => uncPathRegex.test(path);

export const findUriByRef = (uris: vscode.Uri[], ref: string): vscode.Uri | undefined =>
  uris.find((uri) => {
    if (containsImageExt(ref)) {
      if (isLongRef(ref)) {
        return uri.fsPath.toLowerCase().endsWith(ref.toLowerCase());
      }

      return path.basename(uri.fsPath).toLowerCase() === ref.toLowerCase();
    }

    if (isLongRef(ref)) {
      return uri.fsPath.toLowerCase().endsWith(`${ref.toLowerCase()}.md`);
    }

    const name = path.parse(uri.fsPath).name.toLowerCase();

    return containsMarkdownExt(path.basename(uri.fsPath)) && name === ref.toLowerCase();
  });
