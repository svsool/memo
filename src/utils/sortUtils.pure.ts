import type * as vscode from 'vscode';
import { sort as _sortByPath } from 'cross-path-sort';

import { FoundRefT } from '../types';

export type GetMTimeOfFile = (uri: vscode.Uri) => Promise<number>;
type PickedFoundRefT = {
  location: Pick<FoundRefT['location'], 'uri'>;
};

const sortByPath = async (referencesByPath: Record<string, PickedFoundRefT[]>) => {
  // sort keys by path
  return _sortByPath(Object.keys(referencesByPath), { shallowFirst: true });
};

const sortByAlphabetical = async (referencesByPath: Record<string, PickedFoundRefT[]>) => {
  // sort keys by alphabetical
  const pathsSorted = Object.keys(referencesByPath).sort();
  return pathsSorted;
};

const getMTimeOfLastModifiedRef =
  (getMTimeOfFile: GetMTimeOfFile) => async (refs: PickedFoundRefT[]) => {
    // find the last modified ref's mtime in refs
    const refsWithModified = await Promise.all(refs.map((ref) => getMTimeOfFile(ref.location.uri)));
    return Math.max(...refsWithModified);
  };

const withModifiedTime =
  (getMTimeOfFile: GetMTimeOfFile, file: (path: string) => vscode.Uri) =>
  (type: SortPathsByModifiedType) =>
  async ([path, ref]: [string, PickedFoundRefT[]]): Promise<Readonly<[number, string]>> => {
    const lastModified =
      type === 'last-modified'
        ? await getMTimeOfFile(file(path))
        : await getMTimeOfLastModifiedRef(getMTimeOfFile)(ref);
    return [lastModified, path] as const;
  };

const sortByLastModified =
  (getMTimeOfFile: GetMTimeOfFile, file: (path: string) => vscode.Uri) =>
  (type: SortPathsByModifiedType) =>
  async (referencesByPath: Record<string, PickedFoundRefT[]>): Promise<string[]> => {
    // sort keys by last modified
    const refsWithModifiedTime = await Promise.all(
      Object.entries(referencesByPath).map(withModifiedTime(getMTimeOfFile, file)(type)),
    );

    const pathsSorted = refsWithModifiedTime.sort(([a], [b]) => b - a).map(([, path]) => path);
    return pathsSorted;
  };

export type SortFunction = (
  referencesByPath: Record<string, PickedFoundRefT[]>,
) => Promise<string[]>;
export type SortPathsType = 'path' | 'alphabet' | SortPathsByModifiedType;
export type SortPathsByModifiedType = 'last-modified' | 'last-modified-refs';
export type SortPathsDefaultType = typeof sortPathsDefaultType;
export const sortPathsDefaultType = 'path' satisfies SortPathsType;

export const _sortPaths = (getMTimeOfFile: GetMTimeOfFile, file: (path: string) => vscode.Uri) => {
  const sortMap = {
    path: sortByPath,
    alphabet: sortByAlphabetical,
    'last-modified': sortByLastModified(getMTimeOfFile, file)('last-modified'),
    'last-modified-refs': sortByLastModified(getMTimeOfFile, file)('last-modified-refs'),
  } as const satisfies Record<SortPathsType, SortFunction>;

  return (order: SortPathsType) => (referencesByPath: Record<string, PickedFoundRefT[]>) => {
    return sortMap[order](referencesByPath);
  };
};
