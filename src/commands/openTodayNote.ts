import { commands } from 'vscode';

import { getDateInYYYYMMDDFormat } from '../utils';

const openTodayNote = async () =>
  await commands.executeCommand('_memo.openTextDocument', { reference: getDateInYYYYMMDDFormat() });

export default openTodayNote;
