import { Position, Range, TextDocument, TextEditor } from 'vscode';
import fs from 'fs';

/*
  Some of these utils borrowed from https://github.com/yzhang-gh/vscode-markdown
*/

export function isMdEditor(editor: TextEditor) {
  return editor && editor.document && editor.document.languageId === 'markdown';
}

export const REGEX_FENCED_CODE_BLOCK = /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;

const REGEX_CODE_SPAN = /`[^`]*?`/gm;

export const lineBreakOffsetsByLineIndex = (value: string): number[] => {
  const result = [];
  let index = value.indexOf('\n');

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf('\n', index + 1);
  }

  result.push(value.length + 1);

  return result;
};

export const positionToOffset = (content: string, position: { line: number; column: number }) => {
  if (position.line < 0) {
    throw new Error('Illegal argument: line must be non-negative');
  }

  if (position.column < 0) {
    throw new Error('Illegal argument: column must be non-negative');
  }

  const lineBreakOffsetsByIndex = lineBreakOffsetsByLineIndex(content);
  if (lineBreakOffsetsByIndex[position.line] !== undefined) {
    return (lineBreakOffsetsByIndex[position.line - 1] || 0) + position.column || 0;
  }

  return 0;
};

export const isInFencedCodeBlock = (
  documentOrContent: TextDocument | string,
  lineNum: number,
): boolean => {
  const content =
    typeof documentOrContent === 'string' ? documentOrContent : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: 0 }))
    .replace(REGEX_FENCED_CODE_BLOCK, '')
    .replace(/<!--[\W\w]+?-->/g, '');
  // So far `textBefore` should contain no valid fenced code block or comment
  return /^( {0,3}|\t)```[^`\r\n]*$[\w\W]*$/gm.test(textBefore);
};

export const isInCodeSpan = (
  documentOrContent: TextDocument | string,
  lineNum: number,
  offset: number,
): boolean => {
  const content =
    typeof documentOrContent === 'string' ? documentOrContent : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: offset }))
    .replace(REGEX_CODE_SPAN, '')
    .trim();

  return /`[^`]*$/gm.test(textBefore);
};

export const mathEnvCheck = (doc: TextDocument, pos: Position): string => {
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
};

let fileSizesCache: { [path: string]: [number, boolean] } = {};

export const cleanFileSizesCache = () => {
  fileSizesCache = {};
};

export const isFileTooLarge = (
  document: TextDocument,
  sizeLimit: number = 50000 /* ~50 KB */,
): boolean => {
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
};
