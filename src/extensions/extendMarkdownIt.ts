import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import { getWorkspaceCache } from '../utils';

const imageExts = ['png', 'jpg', 'jpeg', 'svg', 'gif'];

const getInvalidRefAnchor = (text: string) =>
  `<a data-invalid-ref style="color: #cc0013; cursor: not-allowed;" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${text}" href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  return md
    .use(markdownItRegex, {
      name: 'ref-resource',
      regex: /!\[\[(.+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const matchLowered = refStr.toLowerCase();

        if (imageExts.some((ext) => matchLowered.includes(ext))) {
          const imageUri = getWorkspaceCache().imageUris.find(({ fsPath: path }) =>
            path.toLowerCase().includes(matchLowered),
          )?.fsPath;

          if (imageUri) {
            return `<div><img src="${imageUri}" alt="${label || refStr}" /></div>`;
          }
        }

        const markdownUri = getWorkspaceCache().markdownUris.find(({ fsPath: path }) =>
          path.toLowerCase().includes(matchLowered),
        )?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(label || refStr);
        }

        return getRefAnchor(markdownUri, label || refStr);
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[(.+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const markdownUri = getWorkspaceCache().markdownUris.find(({ fsPath: path }) =>
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
