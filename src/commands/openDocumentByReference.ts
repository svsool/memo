import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  getWorkspaceCache,
  findUriByRef,
  ensureDirectoryExists,
  parseRef,
  getWorkspaceFolder,
  getMemoConfigProperty,
  isLongRef,
} from '../utils';

const openDocumentByReference = async ({
  reference,
  showOption = vscode.ViewColumn.Active,
  file = "",
}: {
  reference: string;
  showOption?: vscode.ViewColumn;
  file?: string;
}) => {
  const { ref } = parseRef(reference);

  const uri = findUriByRef(getWorkspaceCache().allUris, ref, file);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri, showOption);
  } else {
    const workspaceFolder = getWorkspaceFolder()!;
    if (workspaceFolder) {
      const paths = ref.split('/');
      const refExt = path.parse(ref).ext;

      const refWithExt = path.join(
        ...paths.slice(0, -1),
        `${paths.slice(-1)}${refExt !== '.md' && refExt !== '' ? '' : '.md'}`,
      );

      const linksFormat = getMemoConfigProperty('links.format', 'short');
      const linksRules = getMemoConfigProperty('links.rules', []);

      const shortRefFolder =
        linksFormat === 'short' && !isLongRef(ref)
          ? Array.isArray(linksRules) &&
            linksRules.find((rule) => new RegExp(rule.rule).test(refWithExt))?.folder
          : undefined;

      const filePath = path.join(
        workspaceFolder,
        ...(shortRefFolder ? [shortRefFolder, refWithExt] : [refWithExt]),
      );

      // don't override file content if it already exists
      if (!fs.existsSync(filePath)) {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, '');
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), showOption);
    }
  }
};

export default openDocumentByReference;
