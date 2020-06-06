import * as vscode from 'vscode';

import * as syntaxDecorations from './syntaxDecorations';

export const activate = (context: vscode.ExtensionContext) => {
  syntaxDecorations.activate(context);
};
