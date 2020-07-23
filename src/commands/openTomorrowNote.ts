import { commands } from 'vscode';

import { getTomorrowDateInYYYYMMDDFormat } from '../utils';

const openTomorrowNote = async () =>
  await commands.executeCommand('_memo.openDocumentByReference', {
    reference: getTomorrowDateInYYYYMMDDFormat(),
  });

export default openTomorrowNote;
