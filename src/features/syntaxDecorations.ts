import {
  window,
  workspace,
  Position,
  Range,
  TextEditor,
  TextEditorDecorationType,
  ExtensionContext,
} from 'vscode';

import {
  isFileTooLarge,
  isInFencedCodeBlock,
  isInCodeSpan,
  isMdEditor,
  mathEnvCheck,
  refPattern,
} from '../utils';

/*
  Some of this code borrowed from https://github.com/yzhang-gh/vscode-markdown
 */

const decorationTypes: { [type: string]: TextEditorDecorationType } = {
  gray: window.createTextEditorDecorationType({
    rangeBehavior: 1,
    dark: { color: '#636363' },
    light: { color: '#CCC' },
  }),
  lightBlue: window.createTextEditorDecorationType({
    color: '#4080D0',
  }),
};

const decors: { [fileName: string]: { [decorTypeName: string]: Range[] } } = {};

const regexToDecorationTypes: { [regexp: string]: string[] } = {
  // [[ref]]
  [refPattern]: ['gray', 'lightBlue', 'gray'],
};

export const getDecorations = (
  textEditor: TextEditor,
  recompute: boolean = false,
): { [decorTypeName: string]: Range[] } => {
  const doc = textEditor.document;

  if (!recompute && doc.fileName in decors) {
    return decors[doc.fileName];
  }

  decors[doc.fileName] = {};
  Object.keys(decorationTypes).forEach((decorTypeName) => {
    decors[doc.fileName][decorTypeName] = [];
  });

  doc
    .getText()
    .split(/\r?\n/g)
    .forEach((lineText, lineNum) => {
      if (isInFencedCodeBlock(doc, lineNum)) {
        return;
      }

      const noDecorRanges: [number, number][] = [];

      Object.keys(regexToDecorationTypes).forEach((reText) => {
        const decorTypeNames: string[] = regexToDecorationTypes[reText];
        const regex = new RegExp(reText, 'g');

        let match: RegExpExecArray | null;
        while ((match = regex.exec(lineText)) !== null) {
          let startIndex = match.index;

          if (isInCodeSpan(doc, lineNum, startIndex)) {
            continue;
          }

          if (
            noDecorRanges.some(
              (r) =>
                (startIndex > r[0] && startIndex < r[1]) ||
                (match &&
                  startIndex + match[0].length > r[0] &&
                  startIndex + match[0].length < r[1]),
            )
          ) {
            continue;
          }

          for (let i = 0; i < decorTypeNames.length; i++) {
            // Skip if in math environment
            if (mathEnvCheck(doc, new Position(lineNum, startIndex)) !== '') {
              break;
            }

            const decorTypeName = decorTypeNames[i];
            const caughtGroup = decorTypeName === 'codeSpan' ? match[0] : match[i + 1];

            if (decorTypeName === 'gray' && caughtGroup.length > 2) {
              noDecorRanges.push([startIndex, startIndex + caughtGroup.length]);
            }

            const range = new Range(lineNum, startIndex, lineNum, startIndex + caughtGroup.length);
            startIndex += caughtGroup.length;

            // Needed for `[alt](link)` rule. And must appear after `startIndex += caughtGroup.length;`
            if (decorTypeName.length === 0) {
              continue;
            }
            decors[doc.fileName][decorTypeName].push(range);
          }
        }
      });
    });

  return decors[doc.fileName];
};

const updateDecorations = (textEditor?: TextEditor, recompute: boolean = false) => {
  const editor = textEditor || window.activeTextEditor;
  const doc = editor?.document;

  if (!editor || !doc || !isMdEditor(editor) || isFileTooLarge(doc)) {
    return;
  }

  const decors = getDecorations(editor, recompute);

  Object.keys(decors).forEach((decorTypeName) => {
    editor && editor.setDecorations(decorationTypes[decorTypeName], decors[decorTypeName]);
  });
};

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(updateDecorations),
    workspace.onDidChangeTextDocument((event) => {
      const editor = window.activeTextEditor;
      let timeout: NodeJS.Timeout | null = null;
      const triggerUpdateDecorations = (editor: TextEditor) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => updateDecorations(editor, true), 200);
      };

      if (editor !== undefined && event.document === editor.document) {
        triggerUpdateDecorations(editor);
      }
    }),
    workspace.onDidCloseTextDocument((event) => {
      delete decors[event.fileName];
    }),
  );

  const editor = window.activeTextEditor;
  if (editor) {
    updateDecorations(editor, true);
  }
};
