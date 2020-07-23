import { commands } from 'vscode';

import { getTodayDateInYYYYMMDDFormat } from '../utils';

const openTodayNote = async () =>
  await commands.executeCommand('_memo.openDocumentByReference', {
    reference: getTodayDateInYYYYMMDDFormat(),
  });

export default openTodayNote;
