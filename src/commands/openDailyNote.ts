import { commands } from 'vscode';

import { createDailyQuickPick } from '../utils';

const openDailyNote = () => {
  const dailyQuickPick = createDailyQuickPick();

  dailyQuickPick.onDidChangeSelection((selection) =>
    commands.executeCommand('_memo.openDocumentByReference', {
      reference: selection[0].detail,
    }),
  );

  dailyQuickPick.onDidHide(() => dailyQuickPick.dispose());

  dailyQuickPick.show();
};

export default openDailyNote;
