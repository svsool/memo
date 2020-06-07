import vscode from 'vscode';

let imageUris: vscode.Uri[] = [];

let markdownUris: vscode.Uri[] = [];

export const getImagePaths = () => imageUris;

export const getMarkdownPaths = () => markdownUris;

export const sync = async () => {
  imageUris = await vscode.workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif}');
  markdownUris = await vscode.workspace.findFiles('**/*.md');
};

export const activate = async (_: vscode.ExtensionContext) => await sync();
