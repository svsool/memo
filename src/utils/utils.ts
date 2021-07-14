import vscode, {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  GlobPattern,
  Uri,
  workspace,
} from 'vscode';
import path from 'path';
import { sort as sortPaths } from 'cross-path-sort';
import fs from 'fs';
import groupBy from 'lodash.groupby';

import { WorkspaceCache, RefT, FoundRefT, LinkRuleT } from '../types';
import { isInCodeSpan, isInFencedCodeBlock } from './externalUtils';
import { default as createDailyQuickPick } from './createDailyQuickPick';

export { sortPaths, createDailyQuickPick };

const markdownExtRegex = /\.md$/i;

export const imageExts = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];

const imageExtsRegex = new RegExp(`.(${imageExts.join('|')})$`, 'i');

export const otherExts = [
  'doc',
  'docx',
  'rtf',
  'txt',
  'odt',
  'xls',
  'xlsx',
  'ppt',
  'pptm',
  'pptx',
  'pdf',
  'pages',
  'mp4',
  'mov',
  'wmv',
  'flv',
  'avi',
  'mkv',
  'mp3',
  'webm',
  'wav',
  'm4a',
  'ogg',
  '3gp',
  'flac',
];

const otherExtsRegex = new RegExp(`.(${otherExts.join('|')})$`, 'i');

// Remember to edit accordingly when extensions above edited
export const commonExtsHint =
  '.md,.png,.jpg,.jpeg,.svg,.gif,.doc,.docx,.rtf,.txt,.odt,.xls,.xlsx,.ppt,.pptm,.pptx,.pdf';

export const refPattern = '(\\[\\[)([^\\[\\]]+?)(\\]\\])';

export const containsImageExt = (pathParam: string): boolean =>
  !!imageExtsRegex.exec(path.parse(pathParam).ext);

export const containsMarkdownExt = (pathParam: string): boolean =>
  !!markdownExtRegex.exec(path.parse(pathParam).ext);

export const containsOtherKnownExts = (pathParam: string): boolean =>
  !!otherExtsRegex.exec(path.parse(pathParam).ext);

export const containsUnknownExt = (pathParam: string): boolean =>
  path.parse(pathParam).ext !== '' &&
  !containsMarkdownExt(pathParam) &&
  !containsImageExt(pathParam) &&
  !containsOtherKnownExts(pathParam);

export const trimLeadingSlash = (value: string) => value.replace(/^\/+|^\\+/g, '');
export const trimTrailingSlash = (value: string) => value.replace(/\/+$|\\+$/g, '');
export const trimSlashes = (value: string) => trimLeadingSlash(trimTrailingSlash(value));

export const isLongRef = (path: string) => path.split('/').length > 1;

export const normalizeSlashes = (value: string) => value.replace(/\\/gi, '/');

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

const refRegexp = new RegExp(refPattern, 'gi');

export const extractDanglingRefs = (content: string) => {
  const refs: string[] = [];

  content.split(/\r?\n/g).forEach((lineText, lineNum) => {
    for (const match of matchAll(refRegexp, lineText)) {
      const [, , reference] = match;
      if (reference) {
        const offset = (match.index || 0) + 2;

        if (isInFencedCodeBlock(content, lineNum) || isInCodeSpan(content, lineNum, offset)) {
          continue;
        }

        const { ref } = parseRef(reference);

        if (!findUriByRef(getWorkspaceCache().allUris, ref)) {
          refs.push(ref);
        }
      }
    }
  });

  return Array.from(new Set(refs));
};

export const findDanglingRefsByFsPath = async (uris: vscode.Uri[]) => {
  const refsByFsPath: { [key: string]: string[] } = {};

  for (const { fsPath } of uris) {
    const fsPathExists = fs.existsSync(fsPath);
    if (
      !fsPathExists ||
      !containsMarkdownExt(fsPath) ||
      (fsPathExists && fs.lstatSync(fsPath).isDirectory())
    ) {
      continue;
    }

    const doc = workspace.textDocuments.find((doc) => doc.uri.fsPath === fsPath);
    const refs = extractDanglingRefs(doc ? doc.getText() : fs.readFileSync(fsPath).toString());

    if (refs.length) {
      refsByFsPath[fsPath] = refs;
    }
  }

  return refsByFsPath;
};

const workspaceCache: WorkspaceCache = {
  imageUris: [],
  markdownUris: [],
  otherUris: [],
  allUris: [],
  danglingRefsByFsPath: {},
  danglingRefs: [],
  docsCompletionItems: [],
  resourcesCompletionItems: [],
  refsCompletionItems: [],
};

export const getWorkspaceCache = (): WorkspaceCache => workspaceCache;

export const cacheUris = async () => {
  const markdownUris = await findNonIgnoredFiles('**/*.md');
  const imageUris = await findNonIgnoredFiles(`**/*.{${imageExts.join(',')}}`);
  const otherUris = await findNonIgnoredFiles(`**/*.{${otherExts.join(',')}}`);

  workspaceCache.markdownUris = sortPaths(markdownUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.imageUris = sortPaths(imageUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.otherUris = sortPaths(otherUris, { pathKey: 'path', shallowFirst: true });
  workspaceCache.allUris = sortPaths([...markdownUris, ...imageUris, ...otherUris], {
    pathKey: 'path',
    shallowFirst: true,
  });

  cacheUrisCompletionItems();
};

export const cacheRefs = async () => {
  workspaceCache.danglingRefsByFsPath = await findDanglingRefsByFsPath(workspaceCache.markdownUris);
  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );

  cacheRefsCompletionItems();
};

const padWithZero = (n: number): string => (n < 10 ? '0' + n : String(n));

export const generateRefsCompletitionItems = () => {
  const completionItems: CompletionItem[] = [];

  const danglingRefs = getWorkspaceCache().danglingRefs;

  const urisCompletionItemsLength = Math.max(
    getWorkspaceCache().resourcesCompletionItems.length,
    getWorkspaceCache().docsCompletionItems.length,
  );

  danglingRefs.forEach((ref, index) => {
    const item = new CompletionItem(ref, CompletionItemKind.File);

    item.insertText = ref;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(urisCompletionItemsLength + index);

    completionItems.push(item);
  });

  return completionItems;
};

export const generateUrisCompletitionItems = (uris: vscode.Uri[]) => {
  const completionItems: CompletionItem[] = [];

  const urisByPathBasename = groupBy(uris, ({ fsPath }) => path.basename(fsPath).toLowerCase());

  for (const basename in urisByPathBasename) {
    const urisByCanonical = groupBy(urisByPathBasename[basename], (uri) =>
      fs.realpathSync(uri.fsPath),
    );
    const unique = Object.values(urisByCanonical).map((uris) => uris[0]); // take random one, e.g. first
    urisByPathBasename[basename] = unique;
  }

  uris.forEach((uri, index) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    if (!workspaceFolder) {
      return;
    }

    const longRef = fsPathToRef({
      path: uri.fsPath,
      basePath: workspaceFolder.uri.fsPath,
      keepExt: containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const shortRef = fsPathToRef({
      path: uri.fsPath,
      keepExt: containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const urisGroup = urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const searchResult = urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath);

    const isFirstUriInGroup = searchResult === 0;

    // if all other files with the same basename were symlinks then urisGroup.length will be 1
    // and some uris in main array will be missing in group - that's ok
    const isSymlinked = searchResult === -1 && urisGroup.length === 1;

    if (isSymlinked && getMemoConfigProperty('links.completion.removeRedundantSymlinks', false)) {
      return;
    }

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File);

    const linksFormat = getMemoConfigProperty('links.format', 'short');

    item.insertText =
      linksFormat === 'long' || linksFormat === 'absolute' || (!isFirstUriInGroup && !isSymlinked)
        ? longRef
        : shortRef;

    completionItems.push(item);
  });

  return completionItems;
};

export const cacheUrisCompletionItems = () => {
  const markdownCompletitionItems = generateUrisCompletitionItems(getWorkspaceCache().markdownUris);
  const imageCompletitionItems = generateUrisCompletitionItems(getWorkspaceCache().imageUris);
  const otherFilesCompletitionItems = generateUrisCompletitionItems(getWorkspaceCache().otherUris);

  const docsCompletionItems = [
    ...markdownCompletitionItems,
    ...imageCompletitionItems,
    ...otherFilesCompletitionItems,
  ];
  const resourcesCompletionItems = [...imageCompletitionItems, ...markdownCompletitionItems];

  workspaceCache.docsCompletionItems = docsCompletionItems.map((item, index) => {
    item.sortText = padWithZero(index);
    return item;
  });
  workspaceCache.resourcesCompletionItems = resourcesCompletionItems.map((item, index) => {
    item.sortText = padWithZero(index);
    return item;
  });
};

export const cacheRefsCompletionItems = () => {
  workspaceCache.refsCompletionItems = generateRefsCompletitionItems();
};

export const addCachedRefs = async (uris: vscode.Uri[]) => {
  const danglingRefsByFsPath = await findDanglingRefsByFsPath(uris);

  workspaceCache.danglingRefsByFsPath = {
    ...workspaceCache.danglingRefsByFsPath,
    ...danglingRefsByFsPath,
  };

  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );

  cacheRefsCompletionItems();
};

export const removeCachedRefs = async (uris: vscode.Uri[]) => {
  const fsPaths = uris.map(({ fsPath }) => fsPath);

  workspaceCache.danglingRefsByFsPath = Object.entries(workspaceCache.danglingRefsByFsPath).reduce<{
    [key: string]: string[];
  }>((refsByFsPath, [fsPath, refs]) => {
    if (fsPaths.some((p) => fsPath.startsWith(p))) {
      return refsByFsPath;
    }

    refsByFsPath[fsPath] = refs;

    return refsByFsPath;
  }, {});
  workspaceCache.danglingRefs = sortPaths(
    Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))),
    { shallowFirst: true },
  );

  cacheRefsCompletionItems();
};

export const cacheWorkspace = async () => {
  await cacheUris();
  await cacheRefs();
};

export const cleanWorkspaceCache = () => {
  workspaceCache.imageUris = [];
  workspaceCache.markdownUris = [];
  workspaceCache.otherUris = [];
  workspaceCache.allUris = [];
  workspaceCache.danglingRefsByFsPath = {};
  workspaceCache.danglingRefs = [];
  workspaceCache.docsCompletionItems = [];
  workspaceCache.resourcesCompletionItems = [];
};

export const getWorkspaceFolder = (): string | undefined =>
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;

export function getConfigProperty<T>(property: string, fallback: T): T {
  return vscode.workspace.getConfiguration().get(property, fallback);
}

export type MemoBoolConfigProp =
  | 'decorations.enabled'
  | 'links.completion.enabled'
  | 'links.completion.removeRedundantSymlinks'
  | 'links.following.enabled'
  | 'links.preview.enabled'
  | 'links.references.enabled'
  | 'links.sync.enabled'
  | 'backlinksPanel.enabled'
  | 'markdownPreview.enabled';

// absolute is alias of long, check this comment https://github.com/svsool/vscode-memo/pull/131#issuecomment-720277164
export function getMemoConfigProperty(
  property: 'links.format',
  fallback: 'short',
): 'short' | 'long' | 'absolute';

export function getMemoConfigProperty(
  property: 'backlinksPanel.collapseParentItems',
  fallback: null | boolean,
): boolean;

export function getMemoConfigProperty(
  property: 'links.preview.imageMaxHeight',
  fallback: null | number,
): number;

export function getMemoConfigProperty(
  property: 'links.rules',
  fallback: null | Array<LinkRuleT>,
): LinkRuleT[];

export function getMemoConfigProperty(property: MemoBoolConfigProp, fallback: boolean): boolean;

export function getMemoConfigProperty<T>(property: string, fallback: T): T {
  return getConfigProperty(`memo.${property}`, fallback);
}

export const matchAll = (pattern: RegExp, text: string): Array<RegExpMatchArray> => {
  let match: RegExpMatchArray | null;
  const out: RegExpMatchArray[] = [];

  pattern.lastIndex = 0;

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

  const range = document.getWordRangeAtPosition(position, new RegExp(refPattern));

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
  const matches = matchAll(new RegExp(`!\\[\\[(([^\\[\\]]+?)(\\|.*)?)\\]\\]`, 'gi'), content);

  return matches.map((match) => {
    const [, $1] = match;

    return $1;
  });
};

export const findReferences = async (
  refs: string | string[],
  excludePaths: string[] = [],
): Promise<FoundRefT[]> => {
  const searchRefs = typeof refs === 'string' ? [refs] : refs;
  const foundRefs: FoundRefT[] = [];

  for (const { fsPath } of workspaceCache.markdownUris) {
    if (excludePaths.includes(fsPath) || !fs.existsSync(fsPath)) {
      continue;
    }

    const fileContent = fs.readFileSync(fsPath).toString();
    const refRegexp = new RegExp(
      `\\[\\[((${searchRefs.map((ref) => escapeForRegExp(ref)).join('|')})(\\|[^\\[\\]]+?)?)\\]\\]`,
      'gi',
    );

    const fileContentLines = fileContent.split(/\r?\n/g);

    fileContentLines.forEach((lineText, lineNum) => {
      for (const match of matchAll(refRegexp, lineText)) {
        const [, reference] = match;
        const offset = (match.index || 0) + 2;

        if (
          isInFencedCodeBlock(fileContent, lineNum) ||
          isInCodeSpan(fileContent, lineNum, offset)
        ) {
          return;
        }

        const matchText = lineText.slice(Math.max(offset - 2, 0), lineText.length);

        foundRefs.push({
          location: new vscode.Location(
            vscode.Uri.file(fsPath),
            new vscode.Range(
              new vscode.Position(lineNum, offset),
              new vscode.Position(lineNum, offset + reference.length),
            ),
          ),
          matchText: matchText,
        });
      }
    });
  }

  return foundRefs;
};

export const getFileUrlForMarkdownPreview = (filePath: string): string =>
  vscode.Uri.file(filePath).toString().replace('file://', '');

export const getImgUrlForMarkdownPreview = (imagePath: string): string =>
  vscode.Uri.file(imagePath).toString().replace('file://', '');

const uncPathRegex = /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/;

export const isUncPath = (path: string): boolean => uncPathRegex.test(path);

export const findFilesByExts = async (exts: string[]): Promise<vscode.Uri[]> =>
  await findNonIgnoredFiles(`**/*.{${exts.join(',')}}`);

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

export const findUriByRef = (uris: vscode.Uri[], ref: string): vscode.Uri | undefined => {
  return uris.find((uri) => {
    const relativeFsPath =
      path.sep + path.relative(getWorkspaceFolder()!.toLowerCase(), uri.fsPath.toLowerCase());

    if (containsImageExt(ref) || containsOtherKnownExts(ref) || containsUnknownExt(ref)) {
      if (isLongRef(ref)) {
        const relativeFsPathNormalized = normalizeSlashes(relativeFsPath);
        const refLowerCased = ref.toLowerCase();

        return (
          relativeFsPathNormalized.endsWith(refLowerCased) ||
          relativeFsPathNormalized.endsWith(`${refLowerCased}.md`)
        );
      }

      const basenameLowerCased = path.basename(uri.fsPath).toLowerCase();

      return (
        basenameLowerCased === ref.toLowerCase() || basenameLowerCased === `${ref.toLowerCase()}.md`
      );
    }

    if (isLongRef(ref)) {
      return normalizeSlashes(relativeFsPath).endsWith(`${ref.toLowerCase()}.md`);
    }

    const name = path.parse(uri.fsPath).name.toLowerCase();

    return containsMarkdownExt(path.basename(uri.fsPath)) && name === ref.toLowerCase();
  });
};

export const ensureDirectoryExists = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    ensureDirectoryExists(dirname);
    fs.mkdirSync(dirname);
  }
};

export const getRefUnderCursor = ():
  | { range: vscode.Range; ref: string; label: string }
  | null
  | undefined => {
  const activeTextEditor = vscode.window.activeTextEditor;

  const refAtPos =
    activeTextEditor &&
    getReferenceAtPosition(activeTextEditor.document, activeTextEditor.selection.start);

  return refAtPos;
};

export const getRefUriUnderCursor = (): vscode.Uri | null | undefined => {
  const refAtPos = getRefUnderCursor();

  return refAtPos && findUriByRef(getWorkspaceCache().allUris, refAtPos.ref);
};

export const parseRef = (rawRef: string): RefT => {
  const escapedDividerPosition = rawRef.indexOf('\\|');
  const dividerPosition =
    escapedDividerPosition !== -1 ? escapedDividerPosition : rawRef.indexOf('|');

  return {
    ref: dividerPosition !== -1 ? rawRef.slice(0, dividerPosition) : rawRef,
    label:
      dividerPosition !== -1
        ? rawRef.slice(dividerPosition + (escapedDividerPosition !== -1 ? 2 : 1), rawRef.length)
        : '',
  };
};

export const replaceRefs = ({
  refs,
  document,
  onMatch,
  onReplace,
}: {
  refs: { old: string; new: string }[];
  document: vscode.TextDocument;
  onMatch?: () => void;
  onReplace?: () => void;
}): string | null => {
  const content = document.getText();

  const { updatedOnce, nextContent } = refs.reduce(
    ({ updatedOnce, nextContent }, ref) => {
      const pattern = `\\[\\[${escapeForRegExp(ref.old)}(\\|.*)?\\]\\]`;

      if (new RegExp(pattern, 'i').exec(content)) {
        let replacedOnce = false;

        const content = nextContent.replace(new RegExp(pattern, 'gi'), ($0, $1, offset) => {
          const pos = document.positionAt(offset);

          if (
            isInFencedCodeBlock(document, pos.line) ||
            isInCodeSpan(document, pos.line, pos.character)
          ) {
            return $0;
          }

          if (!replacedOnce) {
            onMatch && onMatch();
          }

          onReplace && onReplace();

          replacedOnce = true;

          return `[[${ref.new}${$1 || ''}]]`;
        });

        return {
          updatedOnce: true,
          nextContent: content,
        };
      }

      return {
        updatedOnce: updatedOnce,
        nextContent: nextContent,
      };
    },
    { updatedOnce: false, nextContent: content },
  );

  return updatedOnce ? nextContent : null;
};

export const findNonIgnoredFiles = async (
  include: GlobPattern,
  excludeParam?: string | null,
  maxResults?: number,
  token?: CancellationToken,
): Promise<Uri[]> => {
  const exclude = [
    ...Object.keys(getConfigProperty('search.exclude', {})),
    ...Object.keys(getConfigProperty('file.exclude', {})),
    ...(typeof excludeParam === 'string' ? [excludeParam] : []),
  ].join(',');

  const files = await workspace.findFiles(include, `{${exclude}}`, maxResults, token);

  return files;
};

export const isDefined = <T>(argument: T | undefined): argument is T => argument !== undefined;
