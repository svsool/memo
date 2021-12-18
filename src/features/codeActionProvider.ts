import { CodeActionProvider } from 'vscode';

const codeActionProvider: CodeActionProvider = {
  provideCodeActions(document, range) {
    if (range.isEmpty) {
      return [];
    }

    return [
      {
        title: 'Extract range to a new note',
        command: 'memo.extractRangeToNewNote',
        arguments: [document, range],
      },
    ];
  },
};

export default codeActionProvider;
