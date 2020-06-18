import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import { getWorkspaceCache, containsImageExt } from '../utils';

const getInvalidRefAnchor = (text: string) =>
  `<a data-invalid-ref style="color: #cc0013; cursor: not-allowed;" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${text}" href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  return md
    .use(markdownItRegex, {
      name: 'ref-resource',
      regex: /!\[\[([^\[\]]+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const refStrNormalized = refStr.toLowerCase();

        if (containsImageExt(refStrNormalized)) {
          // TODO: Fix includes here, it can provide wrong file path
          const imageUri = getWorkspaceCache().imageUris.find(({ fsPath: path }) =>
            path.toLowerCase().includes(refStrNormalized),
          )?.fsPath;

          if (imageUri) {
            return `<div><img src="${imageUri}" alt="${label || refStr}" /></div>`;
          }
        }

        const markdownUri = getWorkspaceCache().markdownUris.find(({ fsPath: path }) =>
          // TODO: Fix includes here, it can provide wrong file path
          path.toLowerCase().includes(refStrNormalized),
        )?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(label || refStr);
        }

        return getRefAnchor(markdownUri, label || refStr);
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[([^\[\]]+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const markdownUri = getWorkspaceCache().markdownUris.find(({ fsPath: path }) =>
          // TODO: Fix includes here, it can provide wrong file path
          path.toLowerCase().includes(refStr.toLowerCase()),
        )?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(label || refStr);
        }

        return getRefAnchor(markdownUri, label || refStr);
      },
    });
};

export default extendMarkdownIt;
