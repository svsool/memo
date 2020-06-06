import { ExtensionContext, workspace } from 'vscode';

let imagePaths: string[] = [];

export const getImagePaths = () => imagePaths;

export const activate = async (_: ExtensionContext) => {
  const uris = await workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');

  imagePaths = uris.map((uri) => uri.fsPath);
};
