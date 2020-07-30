import vscode, { workspace } from 'vscode';
import path from 'path';
import { sort as sortPaths } from 'cross-path-sort';
import fs from 'fs';

import getWordRangeAtPosition from './getWordRangeAtPosition';
import { WorkspaceCache, RefT, FoundRefT } from '../types';
import { isInCodeSpan, isInFencedCodeBlock } from './externalUtils';
import { default as createDailyQuickPick } from './createDailyQuickPick';

export { sortPaths, createDailyQuickPick };

const markdownExtRegex = /\.md$/i;

const imageExtsRegex = /\.(png|jpg|jpeg|svg|gif)$/i;

const otherExtsRegex = /\.(doc|docx|rtf|txt|odt|xls|xlsx|ppt|pptm|pptx|pdf|pages|mp4|mov|wmv|flv|avi|mkv|mp3|webm|wav|m4a|ogg|3gp|flac)$/i;

export const commonExts =
  '.md,.png,.jpg,.jpeg,.svg,.gif,.doc,.docx,.rtf,.txt,.odt,.xls,.xlsx,.ppt,.pptm,.pptx,.pdf';

export const refPattern = '(\\[\\[)([^\\[\\]]+?)(\\]\\])';

export const containsImageExt = (path: string): boolean => !!imageExtsRegex.exec(path);

export const containsMarkdownExt = (path: string): boolean => !!markdownExtRegex.exec(path);

export const containsOtherKnownExts = (path: string): boolean => !!otherExtsRegex.exec(path);

export const containsUnknownExt = (path: string): boolean =>
  path.includes('.') &&
  !containsMarkdownExt(path) &&
  !containsImageExt(path) &&
  !containsOtherKnownExts(path);

export const trimLeadingSlash = (value: string) => value.replace(/^\/+|^\\+/g, '');
export const trimTrailingSlash = (value: string) => value.replace(/\/+|^\\+$/g, '');
export const trimSlashes = (value: string) => trimLeadingSlash(trimTrailingSlash(value));

export const isLongRef = (path: string) => path.split('/').length > 1;

const normalizeSlashes = (value: string) => value.replace(/\\/gi, '/');

export const fsPathToRef = ({
  path: fsPath,
  keepExt,
  basePath,
}: {
  path: string;
  keepExt?: boolean;
  basePath?: string;
}): string | null => {
  const ref =
    basePath && fsPath.startsWith(basePath)
      ? normalizeSlashes(fsPath.replace(basePath, ''))
      : path.basename(fsPath);

  if (keepExt) {
    return trimLeadingSlash(ref);
  }

  return trimLeadingSlash(ref.includes('.') ? ref.slice(0, ref.lastIndexOf('.')) : ref);
};

const workspaceCache: WorkspaceCache = {
  imageUris: [],
  markdownUris: [],
  otherUris: [],
  allUris: [],
};

export const getWorkspaceCache = (): WorkspaceCache => workspaceCache;

export const cacheWorkspace = async () => {
  const imageUris = await vscode.workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  const markdownUris = await vscode.workspace.findFiles('**/*.md');
  const otherUris = await vscode.workspace.findFiles('**/*.{doc,docx,odt,pdf,rtf,tex,txt,wpd}');

  workspaceCache.imageUris = sortPaths(imageUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.markdownUris = sortPaths(markdownUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.otherUris = sortPaths(otherUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.allUris = sortPaths([...markdownUris, ...imageUris, ...otherUris], {
    pathKey: 'path',
    shallowFirst: true,
  });
};

export const cleanWorkspaceCache = () => {
  workspaceCache.imageUris = [];
  workspaceCache.markdownUris = [];
  workspaceCache.otherUris = [];
  workspaceCache.allUris = [];
};

export const getWorkspaceFolder = () =>
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;

export const getDateInYYYYMMDDFormat = () => new Date().toISOString().slice(0, 10);

export function getConfigProperty<T>(property: string, fallback: T): T {
  return vscode.workspace.getConfiguration().get(`memo.${property}`, fallback);
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
): { range: vscode.Range; ref: string; label: string } | null => {
  if (
    isInFencedCodeBlock(document, position.line) ||
    isInCodeSpan(document, position.line, position.character)
  ) {
    return null;
  }

  const range = getWordRangeAtPosition(
    document.lineAt(position.line).text,
    position,
    new RegExp(refPattern),
  );

  if (!range) {
    return null;
  }

  const { ref, label } = parseRef(
    document.getText(range).replace('![[', '').replace('[[', '').replace(']]', ''),
  );

  return {
    ref,
    label,
    range,
  };
};

export const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractEmbedRefs = (content: string) => {
  const matches = matchAll(new RegExp(`\\[\\[(([^\\[\\]]+?)(\\|.*)?)\\]\\]`, 'gi'), content);

  return matches.map((match) => {
    const [, $1] = match;

    return $1;
  });
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
    const matches = matchAll(
      new RegExp(`\\[\\[(${escapeForRegExp(ref)}(\\|.*)?)\\]\\]`, 'gi'),
      fileContent,
    );

    if (matches.length) {
      const currentDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(fsPath));
      matches.forEach((match) => {
        const [, $1] = match;
        const offset = (match.index || 0) + 2;

        const refStart = currentDocument.positionAt(offset);
        const lineStart = currentDocument.lineAt(refStart);

        if (
          isInFencedCodeBlock(currentDocument, lineStart.lineNumber) ||
          isInCodeSpan(currentDocument, lineStart.lineNumber, offset)
        ) {
          return;
        }

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

export const findFilesByExts = async (exts: string[]) =>
  await workspace.findFiles(`**/*.{${exts.join(',')}}`);

export const findAllUrisWithUnknownExts = async (uris: vscode.Uri[]) => {
  const unknownExts = Array.from(
    new Set(
      uris
        .filter(({ fsPath }) => containsUnknownExt(fsPath))
        .map(({ fsPath }) => path.parse(fsPath).ext.replace(/^\./, '')),
    ),
  );

  return unknownExts.length ? await findFilesByExts(unknownExts) : [];
};

export const extractExt = (value: string) => path.parse(value).ext.replace(/^\./, '');

export const findUriByRef = (uris: vscode.Uri[], ref: string): vscode.Uri | undefined =>
  uris.find((uri) => {
    if (containsImageExt(ref) || containsOtherKnownExts(ref) || containsUnknownExt(ref)) {
      if (isLongRef(ref)) {
        return normalizeSlashes(uri.fsPath.toLowerCase()).endsWith(ref.toLowerCase());
      }

      return path.basename(uri.fsPath).toLowerCase() === ref.toLowerCase();
    }

    if (isLongRef(ref)) {
      return normalizeSlashes(uri.fsPath.toLowerCase()).endsWith(`${ref.toLowerCase()}.md`);
    }

    const name = path.parse(uri.fsPath).name.toLowerCase();

    return containsMarkdownExt(path.basename(uri.fsPath)) && name === ref.toLowerCase();
  });

// TODO: Rename to ensureDirectoryExists
export const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }
};

export const getRefUriUnderCursor = (): vscode.Uri | null | undefined => {
  const activeTextEditor = vscode.window.activeTextEditor;

  const refAtPos =
    activeTextEditor &&
    getReferenceAtPosition(activeTextEditor.document, activeTextEditor.selection.start);

  return refAtPos && findUriByRef(getWorkspaceCache().allUris, refAtPos.ref);
};

export const parseRef = (rawRef: string): RefT => {
  const dividerPosition = rawRef.indexOf('|');

  return {
    ref: dividerPosition !== -1 ? rawRef.slice(0, dividerPosition) : rawRef,
    label: dividerPosition !== -1 ? rawRef.slice(dividerPosition + 1, rawRef.length) : '',
  };
};
