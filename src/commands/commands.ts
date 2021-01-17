import vscode from 'vscode';

import openDocumentByReference from './openDocumentByReference';
import openRandomNote from './openRandomNote';
import openReferenceInDefaultApp from './openReferenceInDefaultApp';
import openReferenceBeside from './openReferenceBeside';
import openDailyNote from './openDailyNote';
import { cacheWorkspace, cleanWorkspaceCache, getWorkspaceCache } from '../utils';

const commands = [
  vscode.commands.registerCommand('_memo.openDocumentByReference', openDocumentByReference),
  vscode.commands.registerCommand('_memo.cacheWorkspace', cacheWorkspace),
  vscode.commands.registerCommand('_memo.cleanWorkspaceCache', cleanWorkspaceCache),
  vscode.commands.registerCommand('_memo.getWorkspaceCache', getWorkspaceCache),
  vscode.commands.registerCommand('memo.openRandomNote', openRandomNote),
  vscode.commands.registerCommand('memo.openDailyNote', openDailyNote),
  vscode.commands.registerCommand('memo.openReferenceInDefaultApp', openReferenceInDefaultApp),
  vscode.commands.registerCommand('memo.openReferenceBeside', openReferenceBeside),
];

export default commands;
