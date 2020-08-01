import fs from 'fs';
import path from 'path';
import { window, commands, Uri, ExtensionContext } from 'vscode';

// Add new version teasers for showing notification on extension update if needed
const teasers: { [key: string]: string } = {
  '0.1.11': 'Memo v0.1.11! New "Open daily note" command added.',
  '0.1.10': 'Memo v0.1.10! Links rename, opening links in the default app and more.',
};

const showMeAction = 'Show Me';

export const activate = (context: ExtensionContext) => {
  try {
    const versionPath = path.join(context.extensionPath, 'VERSION');
    const data = fs.readFileSync(path.join(context.extensionPath, 'package.json')).toString();
    const currentVersion: string = JSON.parse(data).version;

    const teaserMsg = teasers[currentVersion];

    if (
      !teaserMsg ||
      (fs.existsSync(versionPath) && fs.readFileSync(versionPath).toString() === currentVersion)
    ) {
      return;
    }

    fs.writeFileSync(versionPath, currentVersion);

    window.showInformationMessage(teaserMsg, showMeAction, 'Dismiss').then((option) => {
      if (option === showMeAction) {
        commands.executeCommand(
          'vscode.open',
          Uri.parse('https://github.com/svsool/vscode-memo/blob/master/CHANGELOG.md'),
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
};
