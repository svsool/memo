import { commands } from 'vscode';

import { getYesterdayDateInYYYYMMDDFormat } from '../utils';

const openYesterdayNote = async () =>
  await commands.executeCommand('_memo.openDocumentByReference', {
    reference: getYesterdayDateInYYYYMMDDFormat(),
  });

export default openYesterdayNote;
