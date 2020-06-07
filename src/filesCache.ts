import { ExtensionContext, workspace } from 'vscode';

let imagePaths: string[] = [];

let markdownPaths: string[] = [];

export const getImagePaths = () => imagePaths;

export const getMarkdownPaths = () => markdownPaths;

export const activate = async (_: ExtensionContext) => {
  const imageUris = await workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  const markdownUris = await workspace.findFiles('**/*.md');

  imagePaths = imageUris.map((uri) => uri.fsPath);
  markdownPaths = markdownUris.map((uri) => uri.fsPath);
};
