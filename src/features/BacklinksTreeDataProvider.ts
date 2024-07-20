import vscode, { workspace } from 'vscode';
import path from 'path';
import groupBy from 'lodash.groupby';

import { cache } from '../workspace';
import {
  containsMarkdownExt,
  findReferences,
  trimSlashes,
  sortPaths,
  getMemoConfigProperty,
  fsPathToRef,
  isDefined,
} from '../utils';
import { FoundRefT } from '../types';

class Backlink extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public refs: FoundRefT[] | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
  }
}

export default class BacklinksTreeDataProvider implements vscode.TreeDataProvider<Backlink> {
  private _onDidChangeTreeData: vscode.EventEmitter<Backlink | undefined> = new vscode.EventEmitter<
    Backlink | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<Backlink | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: Backlink) {
    return element;
  }

  public async getChildren(element?: Backlink) {
    if (!element) {
      const uri = vscode.window.activeTextEditor?.document.uri;
      const fsPath = uri?.fsPath;

      if (!uri || !fsPath || (fsPath && !containsMarkdownExt(fsPath))) {
        return [];
      }

      const workspaceFolder = workspace.getWorkspaceFolder(uri);

      if (!workspaceFolder) {
        return [];
      }

      const shortRef = fsPathToRef({
        path: uri.fsPath,
        keepExt: false,
      });

      const longRef = fsPathToRef({
        path: uri.fsPath,
        basePath: workspaceFolder.uri.fsPath,
        keepExt: false,
      });

      if (!shortRef || !longRef) {
        return [];
      }

      const urisByPathBasename = groupBy(cache.getWorkspaceCache().markdownUris, ({ fsPath }) =>
        path.basename(fsPath).toLowerCase(),
      );

      const urisGroup = urisByPathBasename[path.basename(fsPath).toLowerCase()] || [];

      const isFirstUriInGroup = urisGroup.findIndex((uriParam) => uriParam.fsPath === fsPath) === 0;

      const referencesByPath = groupBy(
        await findReferences(
          [shortRef !== longRef && isFirstUriInGroup ? shortRef : undefined, longRef].filter(
            isDefined,
          ),
          [fsPath],
        ),
        ({ location }) => location.uri.fsPath,
      );

      const sortOrder = getMemoConfigProperty('backlinksPanel.sortOrder', 'path');
      const pathsSorted = await sortPaths(sortOrder)(referencesByPath);

      if (!pathsSorted.length) {
        return [];
      }

      const collapsibleState = getMemoConfigProperty('backlinksPanel.collapseParentItems', false)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.Expanded;

      return pathsSorted.map((pathParam) => {
        const backlink = new Backlink(
          path.basename(pathParam),
          referencesByPath[pathParam],
          collapsibleState,
        );
        backlink.description = [
          `(${referencesByPath[pathParam].length})`,
          trimSlashes(
            pathParam.replace(workspaceFolder.uri.fsPath, '').replace(path.basename(pathParam), ''),
          ).trim(),
        ]
          .filter(Boolean)
          .join(' ');
        backlink.tooltip = pathParam;
        backlink.command = {
          command: 'vscode.open',
          arguments: [vscode.Uri.file(pathParam), { selection: new vscode.Range(0, 0, 0, 0) }],
          title: 'Open File',
        };
        return backlink;
      });
    }

    const refs = element?.refs;

    if (!refs) {
      return [];
    }

    return refs.map((ref) => {
      const backlink = new Backlink(
        `${ref.location.range.start.line + 1}:${ref.location.range.start.character}`,
        undefined,
        vscode.TreeItemCollapsibleState.None,
      );

      backlink.description = ref.matchText;
      backlink.tooltip = ref.matchText;
      backlink.command = {
        command: 'vscode.open',
        arguments: [ref.location.uri, { selection: ref.location.range }],
        title: 'Open File',
      };

      return backlink;
    });
  }
}
