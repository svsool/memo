import { window, workspace, Position, Range, TextEditor, TextEditorDecorationType } from 'vscode';

import { isFileTooLarge, isInFencedCodeBlock, isMdEditor, mathEnvCheck } from '../utils';

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

const decors: { [decorTypeName: string]: Range[] } = {};

const regexToDecorationTypes: { [regexp: string]: string[] } = {
  // [[ref]]
  '(\\[\\[)(.+?)(\\]\\])': ['gray', 'lightBlue', 'gray'],
};

const updateDecorations = (textEditor?: TextEditor) => {
  const editor = textEditor || window.activeTextEditor;
  const doc = editor?.document;

  if (!editor || !doc || !isMdEditor(editor) || isFileTooLarge(doc)) {
    return;
  }

  Object.keys(decorationTypes).forEach((decorTypeName) => {
    decors[decorTypeName] = [];
  });

  doc
    .getText()
    .split(/\r?\n/g)
    .forEach((lineText, lineNum) => {
      if (isInFencedCodeBlock(doc, lineNum)) {
        return;
      }

      // Trick. Match `[alt](link)` and `![alt](link)` first and remember those greyed out ranges
      const noDecorRanges: [number, number][] = [];

      Object.keys(regexToDecorationTypes).forEach((reText) => {
        const decorTypeNames: string[] = regexToDecorationTypes[reText];
        const regex = new RegExp(reText, 'g');

        let match: RegExpExecArray | null;
        while ((match = regex.exec(lineText)) !== null) {
          let startIndex = match.index;

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
            //// Skip if in math environment
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

            //// Needed for `[alt](link)` rule. And must appear after `startIndex += caughtGroup.length;`
            if (decorTypeName.length === 0) {
              continue;
            }
            decors[decorTypeName].push(range);
          }
        }
      });
    });

  Object.keys(decors).forEach((decorTypeName) => {
    editor && editor.setDecorations(decorationTypes[decorTypeName], decors[decorTypeName]);
  });
};

export const activate = () => {
  workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('markdown.extension.syntax.decorations')) {
      window.showInformationMessage(
        'Please reload VSCode to make setting `syntax.decorations` take effect.',
      );
    }
  });

  if (!workspace.getConfiguration('markdown.extension.syntax').get<boolean>('decorations')) {
    return;
  }

  window.onDidChangeActiveTextEditor(updateDecorations);

  workspace.onDidChangeTextDocument((event) => {
    const editor = window.activeTextEditor;
    let timeout: NodeJS.Timeout | null = null;
    const triggerUpdateDecorations = (editor: TextEditor) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => updateDecorations(editor), 200);
    };

    if (editor !== undefined && event.document === editor.document) {
      triggerUpdateDecorations(editor);
    }
  });

  const editor = window.activeTextEditor;
  if (editor) {
    updateDecorations(editor);
  }
};
