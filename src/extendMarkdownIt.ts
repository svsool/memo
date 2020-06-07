import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import { getImagePaths, getMarkdownPaths } from './fsCache';

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
          const imagePath = getImagePaths().find((path) =>
            path.toLowerCase().includes(match.toLowerCase()),
          );

          if (imagePath) {
            return `<img src="${imagePath}" title="${match}" />`;
          }
        }

        const markdownPath = getMarkdownPaths().find((path) =>
          path.toLowerCase().includes(match.toLowerCase()),
        );

        if (!markdownPath) {
          return getInvalidRefAnchor(match);
        }

        return getRefAnchor(markdownPath, match);
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[(.+?)\]\]/,
      replace: (match: string) => {
        const markdownPath = getMarkdownPaths().find((path) =>
          path.toLowerCase().includes(match.toLowerCase()),
        );

        if (!markdownPath) {
          return getInvalidRefAnchor(match);
        }

        return getRefAnchor(markdownPath, match);
      },
    });
};

export default extendMarkdownIt;
