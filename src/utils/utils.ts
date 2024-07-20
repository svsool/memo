import vscode, { CancellationToken, GlobPattern, Uri, workspace } from 'vscode';
import path from 'path';
import fs from 'fs';

import { RefT, FoundRefT, LinkRuleT, ExtractedRefT } from '../types';
import { cache } from '../workspace';
import { isInCodeSpan, isInFencedCodeBlock } from './externalUtils';
import { SortPathsDefaultType, SortPathsType } from './sortUtils.pure';

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
  'msg',
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

        if (!findUriByRef(cache.getWorkspaceCache().allUris, ref)) {
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

export const getWorkspaceFolder = (): string | undefined =>
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;

export function getConfigProperty<T>(property: string, fallback: T): T {
  return vscode.workspace.getConfiguration().get(property, fallback);
}

export type MemoBoolConfigProp =
  | 'links.completion.enabled'
  | 'links.following.enabled'
  | 'links.preview.enabled'
  | 'links.references.enabled'
  | 'links.sync.enabled'
  | 'backlinksPanel.enabled'
  | 'markdownPreview.enabled';

export function getMemoConfigProperty(
  property: 'links.format',
  fallback: 'short',
): 'short' | 'long';

export function getMemoConfigProperty(
  property: 'backlinksPanel.sortOrder',
  fallback: SortPathsDefaultType,
): SortPathsType;

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

const refsToRegExp = (refs: string | string[]) => {
  const refsArr = typeof refs === 'string' ? [refs] : refs;

  return new RegExp(
    `\\[\\[((${refsArr.map((ref) => escapeForRegExp(ref)).join('|')})(\\|[^\\[\\]]+?)?)\\]\\]`,
    'gi',
  );
};

export const extractRefsFromText = (
  refs: string | string[] | RegExp,
  text: string,
): ExtractedRefT[] => {
  const refsRegexp = refs instanceof RegExp ? refs : refsToRegExp(refs);

  const foundRefs: ExtractedRefT[] = [];

  text.split(/\r?\n/g).forEach((lineText, lineNum) => {
    for (const match of matchAll(refsRegexp, lineText)) {
      const [, reference] = match;
      const offset = (match.index || 0) + 2;

      if (isInFencedCodeBlock(text, lineNum) || isInCodeSpan(text, lineNum, offset)) {
        return;
      }

      foundRefs.push({
        ref: {
          position: {
            start: new vscode.Position(lineNum, offset),
            end: new vscode.Position(lineNum, offset + reference.length),
          },
          text: lineText.slice(Math.max(offset, 0), offset + reference.length),
        },
        line: {
          trailingText: lineText.slice(Math.max(offset - 2, 0), lineText.length),
        },
      });
    }
  });

  return foundRefs;
};

export const findReferences = async (
  refs: string | string[],
  excludePaths: string[] = [],
): Promise<FoundRefT[]> => {
  const foundRefs: FoundRefT[] = [];

  for (const { fsPath } of cache.getWorkspaceCache().markdownUris) {
    if (excludePaths.includes(fsPath) || !fs.existsSync(fsPath)) {
      continue;
    }

    const extractedRefs = extractRefsFromText(refs, fs.readFileSync(fsPath).toString()).map(
      ({ ref, line }) => ({
        location: new vscode.Location(
          vscode.Uri.file(fsPath),
          new vscode.Range(ref.position.start, ref.position.end),
        ),
        matchText: line.trailingText,
      }),
    );

    foundRefs.push(...extractedRefs);
  }

  return foundRefs;
};

export const getFileUrlForMarkdownPreview = (filePathParam: string): string => {
  const workspaceFolder = getWorkspaceFolder();
  const filePath = workspaceFolder ? filePathParam.replace(workspaceFolder, '') : filePathParam;

  return vscode.Uri.file(filePath).toString().replace('file://', '');
};

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

export const findUriByRef = (
  uris: vscode.Uri[],
  ref: string,
  options: { workspaceFolder?: string } = {},
): vscode.Uri | undefined => {
  return uris.find((uri) => {
    const relativeFsPath =
      path.sep +
      path.relative(
        (options.workspaceFolder || getWorkspaceFolder()!).toLowerCase(),
        uri.fsPath.toLowerCase(),
      );

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

  return refAtPos && findUriByRef(cache.getWorkspaceCache().allUris, refAtPos.ref);
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

export const getRefWithExt = (ref: string) => {
  const paths = ref.split('/');
  const refExt = path.parse(ref).ext;

  return path.join(
    ...paths.slice(0, -1),
    `${paths.slice(-1)}${refExt !== '.md' && refExt !== '' ? '' : '.md'}`,
  );
};

export const getDirRelativeToWorkspace = (uri: Uri | undefined) => {
  const workspaceFolder = uri && workspace.getWorkspaceFolder(uri)?.uri.fsPath;

  if (!workspaceFolder || !uri) {
    return;
  }

  return path.dirname(uri.fsPath).replace(workspaceFolder, '');
};

export const resolveShortRefFolder = (ref: string): string | undefined => {
  const linksFormat = getMemoConfigProperty('links.format', 'short');
  const linksRules = getMemoConfigProperty('links.rules', []);
  const refWithExt = getRefWithExt(ref);

  if (linksFormat !== 'short' || isLongRef(ref) || !Array.isArray(linksRules)) {
    return;
  }

  let linkRegExpMatchArr: RegExpMatchArray | null = null;
  let linkRule: LinkRuleT | null = null;

  for (const rule of linksRules) {
    const matchRes = new RegExp(rule.rule).exec(refWithExt);

    if (matchRes) {
      linkRegExpMatchArr = matchRes;
      linkRule = rule;

      break;
    }
  }

  if (!linkRule) {
    return;
  }

  const date = new Date();

  // https://github.com/microsoft/vscode/blob/main/src/vs/editor/contrib/snippet/snippetVariables.ts
  const varsReplacementMap: { name: string; value: string }[] = [
    {
      name: '$CURRENT_FILE_DIRECTORY',
      value: getDirRelativeToWorkspace(vscode.window.activeTextEditor?.document.uri) || '',
    },
    { name: '$CURRENT_YEAR_SHORT', value: String(date.getFullYear()).slice(-2) },
    { name: '$CURRENT_YEAR', value: String(date.getFullYear()) },
    { name: '$CURRENT_MONTH', value: String(date.getMonth().valueOf() + 1).padStart(2, '0') },
    { name: '$CURRENT_DATE', value: String(date.getDate().valueOf()).padStart(2, '0') },
    { name: '$CURRENT_HOUR', value: String(date.getHours().valueOf()).padStart(2, '0') },
    { name: '$CURRENT_MINUTE', value: String(date.getMinutes().valueOf()).padStart(2, '0') },
    { name: '$CURRENT_SECONDS_UNIX', value: String(Math.floor(date.getTime() / 1000)) },
    { name: '$CURRENT_SECOND', value: String(date.getSeconds().valueOf()).padStart(2, '0') },
  ];

  if (linkRegExpMatchArr) {
    linkRegExpMatchArr.forEach((match, index) => {
      varsReplacementMap.push({ name: `$${index}`, value: match });
    });
  }

  let folder = linkRule.folder;

  for (const { name, value } of varsReplacementMap) {
    folder = folder.replace(new RegExp(escapeForRegExp(name), 'g'), value);
  }

  return folder;
};

export const isDefined = <T>(argument: T | undefined): argument is T => argument !== undefined;
