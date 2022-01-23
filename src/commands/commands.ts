import vscode from 'vscode';

import openDocumentByReference from './openDocumentByReference';
import openRandomNote from './openRandomNote';
import openReferenceInDefaultApp from './openReferenceInDefaultApp';
import openReferenceBeside from './openReferenceBeside';
import openDailyNote from './openDailyNote';
import pasteHtmlAsMarkdown from './pasteHtmlAsMarkdown';
import extractRangeToNewNote from './extractRangeToNewNote';
import { cache } from '../workspace';

const commands = [
  vscode.commands.registerCommand('_memo.openDocumentByReference', openDocumentByReference),
  vscode.commands.registerCommand('_memo.cacheWorkspace', cache.cacheWorkspace),
  vscode.commands.registerCommand('_memo.cleanWorkspaceCache', cache.cleanWorkspaceCache),
  vscode.commands.registerCommand('_memo.getWorkspaceCache', cache.getWorkspaceCache),
  vscode.commands.registerCommand('memo.openRandomNote', openRandomNote),
  vscode.commands.registerCommand('memo.openDailyNote', openDailyNote),
  vscode.commands.registerCommand('memo.openReferenceInDefaultApp', openReferenceInDefaultApp),
  vscode.commands.registerCommand('memo.openReferenceBeside', openReferenceBeside),
  vscode.commands.registerCommand('memo.extractRangeToNewNote', extractRangeToNewNote),
  vscode.commands.registerCommand('memo.pasteHtmlAsMarkdown', pasteHtmlAsMarkdown),
];

export default commands;
