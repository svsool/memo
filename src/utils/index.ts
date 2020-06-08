import * as fs from 'fs';
import { workspace, Uri, Position, Range, TextDocument, TextEditor } from 'vscode';
import path from 'path';

/*
  Borrowed from https://github.com/yzhang-gh/vscode-markdown
 */
export function isMdEditor(editor: TextEditor) {
  return editor && editor.document && editor.document.languageId === 'markdown';
}

export const REGEX_FENCED_CODE_BLOCK = /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;

/*
  Borrowed from https://github.com/yzhang-gh/vscode-markdown
 */
export function isInFencedCodeBlock(doc: TextDocument, lineNum: number): boolean {
  let textBefore = doc.getText(new Range(new Position(0, 0), new Position(lineNum, 0)));
  textBefore = textBefore.replace(REGEX_FENCED_CODE_BLOCK, '').replace(/<!--[\W\w]+?-->/g, '');
  //// So far `textBefore` should contain no valid fenced code block or comment
  return /^( {0,3}|\t)```[^`\r\n]*$[\w\W]*$/gm.test(textBefore);
}

/*
  Borrowed from https://github.com/yzhang-gh/vscode-markdown
 */
export function mathEnvCheck(doc: TextDocument, pos: Position): string {
  const lineTextBefore = doc.lineAt(pos.line).text.substring(0, pos.character);
  const lineTextAfter = doc.lineAt(pos.line).text.substring(pos.character);

  if (/(^|[^\$])\$(|[^ \$].*)\\\w*$/.test(lineTextBefore) && lineTextAfter.includes('$')) {
    // Inline math
    return 'inline';
  } else {
    const textBefore = doc.getText(new Range(new Position(0, 0), pos));
    const textAfter = doc.getText().substr(doc.offsetAt(pos));
    let matches;
    if (
      (matches = textBefore.match(/\$\$/g)) !== null &&
      matches.length % 2 !== 0 &&
      textAfter.includes('$$')
    ) {
      // $$ ... $$
      return 'display';
    } else {
      return '';
    }
  }
}

const sizeLimit = 50000; // ~50 KB
let fileSizesCache: { [path: string]: [number, boolean] } = {};

/*
  Borrowed from https://github.com/yzhang-gh/vscode-markdown
 */
export function isFileTooLarge(document: TextDocument): boolean {
  const filePath = document.uri.fsPath;
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }
  const version = document.version;
  if (fileSizesCache.hasOwnProperty(filePath) && fileSizesCache[filePath][0] === version) {
    return fileSizesCache[filePath][1];
  } else {
    const isTooLarge = fs.statSync(filePath)['size'] > sizeLimit;
    fileSizesCache[filePath] = [version, isTooLarge];
    return isTooLarge;
  }
}

const allExtsRegex = /\.(md|png|jpg|jpeg|svg|gif)$/;

const markdownExtRegex = /\.md$/;

const imageExtsRegex = /\.(png|jpg|jpeg|svg|gif)$/;

export const containsImageExt = (path: string): boolean => !!imageExtsRegex.exec(path);

export const containsMarkdownExt = (path: string): boolean => !!markdownExtRegex.exec(path);

export const extractLongRef = (
  basePathParam: string,
  pathParam: string,
  preserveExtension?: boolean,
): string | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = pathParam.replace(basePathParam, '');

    if (preserveExtension) {
      return ref;
    }

    return ref.replace(allExtsRegex, '');
  }

  return null;
};

export const extractShortRef = (pathParam: string, preserveExtension?: boolean): string | null => {
  const allExtsMatch = allExtsRegex.exec(pathParam);

  if (allExtsMatch) {
    const ref = path.basename(pathParam);

    if (preserveExtension) {
      return ref;
    }

    return ref.replace(allExtsRegex, '');
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
