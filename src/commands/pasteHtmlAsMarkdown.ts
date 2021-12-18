import TurndownService from 'turndown';
import vscode from 'vscode';

import { readClipboard } from '../utils';

const tdSettings = {
  headingStyle: 'atx' as const,
  codeBlockStyle: 'fenced' as const,
};

const pasteHtmlAsMarkdown = async () => {
  const tdService = new TurndownService(tdSettings);

  const clipboard = await readClipboard();

  const markdown = tdService.turndown(clipboard);

  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  editor.edit((edit) => {
    const current = editor.selection;

    editor.selections.forEach((selection) => {
      if (selection.isEmpty) {
        edit.insert(selection.start, markdown);
      } else {
        edit.replace(current, markdown);
      }
    });
  });
};

export default pasteHtmlAsMarkdown;
