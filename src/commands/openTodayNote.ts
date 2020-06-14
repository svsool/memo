import { commands } from 'vscode';

import { getDateInYYYYMMDDFormat } from '../utils';

const openTodayNote = () =>
  commands.executeCommand('_memo.openTextDocument', { reference: getDateInYYYYMMDDFormat() });

export default openTodayNote;
