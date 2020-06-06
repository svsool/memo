import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import { getImagePaths } from './filesCache';

const imageExts = ['png', 'jpg', 'jpeg', 'svg', 'gif'];

const extendMarkdownIt = (md: MarkdownIt) =>
  md
    .use(markdownItRegex, {
      name: 'ref-resource',
      regex: /!\[\[(.+?)\]\]/,
      replace: (match: string) => {
        const matchLowered = match.toLowerCase();

        if (imageExts.some((ext) => matchLowered.includes(ext))) {
          const imagePath = getImagePaths().find((path) => path.includes(match));

          if (imagePath) {
            return `<img src="${imagePath}" title="${match}" />`;
          }
        }

        return `<a href="javascript:void(0)">${match}</a>`;
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[(.+?)\]\]/,
      replace: (match: string) => {
        return `<a href="javascript:void(0)">${match}</a>`;
      },
    });

export default extendMarkdownIt;
