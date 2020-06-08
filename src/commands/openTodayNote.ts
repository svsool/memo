import { commands } from 'vscode';

const openTodayNote = () => {
  const dateInYYYYMMDDFormat = new Date().toISOString().slice(0, 10);

  commands.executeCommand('_memo.openTextDocument', { reference: dateInYYYYMMDDFormat });
};

export default openTodayNote;
