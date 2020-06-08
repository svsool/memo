import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import { getImageUris, getMarkdownUris } from '../utils';

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
      replace: (match: string) => {
        const matchLowered = match.toLowerCase();

        if (imageExts.some((ext) => matchLowered.includes(ext))) {
          const imageUri = getImageUris().find(({ fsPath: path }) =>
            path.toLowerCase().includes(match.toLowerCase()),
          )?.fsPath;

          if (imageUri) {
            return `<img src="${imageUri}" title="${match}" />`;
          }
        }

        const markdownUri = getMarkdownUris().find(({ fsPath: path }) =>
          path.toLowerCase().includes(match.toLowerCase()),
        )?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(match);
        }

        return getRefAnchor(markdownUri, match);
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[(.+?)\]\]/,
      replace: (match: string) => {
        const markdownUri = getMarkdownUris().find(({ fsPath: path }) =>
          path.toLowerCase().includes(match.toLowerCase()),
        )?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(match);
        }

        return getRefAnchor(markdownUri, match);
      },
    });
};

export default extendMarkdownIt;
