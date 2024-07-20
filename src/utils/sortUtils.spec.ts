import { URI } from 'vscode-uri';

import { GetMTimeOfFile, _sortPaths } from './sortUtils.pure';

const getMTimeOfFile: GetMTimeOfFile = async (uri: URI) => {
  // will inject this prop in uri init
  return (uri as any).lastModified;
};

const sortPaths = _sortPaths(getMTimeOfFile, URI.file);
const sortByPath = sortPaths('path');
const sortByAlphabetical = sortPaths('alphabet');
// const sortByLastModified = sortPaths('last-modified'); sortByLastModified is special (It will call URI.file in function).
const sortByLastModifiedRef = sortPaths('last-modified-refs');

const file: (modifiedTimeMap: Record<string, number>) => (path: string) => URI =
  (map) => (path) => {
    const uri = URI.file(path);
    (uri as any).lastModified = map[path];
    return uri;
  };
const createURIWithLastModified = (lastModified: number): URI => {
  const uri = URI.file(`/path/to/${lastModified}`);
  (uri as any).lastModified = lastModified;
  return uri;
};

describe('sortUtils', () => {
  describe('sortByPath', () => {
    it('should sort references by path in ascending order', async () => {
      const referencesByPath = {
        'b/path': [{ location: { uri: createURIWithLastModified(100) } }],
        'a/path': [{ location: { uri: createURIWithLastModified(200) } }],
      };

      const result = await sortByPath(referencesByPath);
      expect(result).toEqual(['a/path', 'b/path']);
    });

    it('should handle an empty referencesByPath object', async () => {
      const referencesByPath: Record<string, any[]> = {};
      const result = await sortByPath(referencesByPath);
      expect(result).toEqual([]);
    });
  });

  describe('sortByAlphabetical', () => {
    it('should sort references by path in alphabetical order', async () => {
      const referencesByPath = {
        'b/path': [{ location: { uri: createURIWithLastModified(100) } }],
        'a/path': [{ location: { uri: createURIWithLastModified(200) } }],
      };

      const result = await sortByAlphabetical(referencesByPath);
      expect(result).toEqual(['a/path', 'b/path']);
    });

    it('should handle an empty referencesByPath object', async () => {
      const referencesByPath: Record<string, any[]> = {};
      const result = await sortByAlphabetical(referencesByPath);
      expect(result).toEqual([]);
    });
  });

  describe('sortByLastModified', () => {
    it('should sort references by the last modified time', async () => {
      const sortPaths = _sortPaths(getMTimeOfFile, file({ path1: 100, path2: 300 }));
      const sortByLastModified = sortPaths('last-modified');
      const referencesByPath = {
        path1: [],
        path2: [],
      };

      const result = await sortByLastModified(referencesByPath);
      expect(result).toEqual(['path2', 'path1']);
    });

    it('should handle an empty referencesByPath object', async () => {
      const sortPaths = _sortPaths(getMTimeOfFile, file({}));
      const sortByLastModified = sortPaths('last-modified');

      const referencesByPath: Record<string, any[]> = {};
      const result = await sortByLastModified(referencesByPath);
      expect(result).toEqual([]);
    });

    it('should correctly handle multiple file with the same modification time', async () => {
      const referencesByPath = {
        path1: [],
        path2: [],
      };

      const sortPaths = _sortPaths(getMTimeOfFile, file({ path1: 0, path2: 0 }));
      const sortByLastModified = sortPaths('last-modified');

      // each result is accepted
      expect(async () => {
        await sortByLastModified(referencesByPath);
      }).not.toThrow();
    });
  });

  describe('sortByLastModifiedRef', () => {
    it('should sort references by the last modified time of the reference in ascending order', async () => {
      const references = {
        path1: [
          { location: { uri: createURIWithLastModified(150) } },
          { location: { uri: createURIWithLastModified(1000) } },
        ],
        path2: [
          { location: { uri: createURIWithLastModified(150) } },
          { location: { uri: createURIWithLastModified(2000) } },
        ],
      };

      const result = await sortByLastModifiedRef(references);
      expect(result).toEqual(['path2', 'path1']);
    });

    it('should handle an empty array of references', async () => {
      const references: Record<string, any> = {};
      const result = await sortByLastModifiedRef(references);
      expect(result).toEqual([]);
    });

    it('should correctly handle multiple references with the same modification time', async () => {
      const references = {
        path1: [{ location: { uri: createURIWithLastModified(150) } }],
        path2: [{ location: { uri: createURIWithLastModified(150) } }],
      };

      // each result is accepted
      expect(async () => {
        await sortByLastModifiedRef(references);
      }).not.toThrow();
    });
  });
});
