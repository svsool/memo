import { commands } from 'vscode';

import { getDateInYYYYMMDDFormat } from '../utils';

const openTodayNote = async () =>
  await commands.executeCommand('_memo.openDocumentByReference', {
    reference: getDateInYYYYMMDDFormat(),
  });

export default openTodayNote;
