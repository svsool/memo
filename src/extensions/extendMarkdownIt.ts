import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';

import {
  getWorkspaceCache,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
  containsImageExt,
  findUriByRef,
} from '../utils';

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

        if (containsImageExt(refStr)) {
          const imagePath = findUriByRef(getWorkspaceCache().imageUris, refStr)?.fsPath;

          if (imagePath) {
            return `<div><img src="${getImgUrlForMarkdownPreview(imagePath)}" alt="${
              label || refStr
            }" /></div>`;
          }
        }

        const markdownUri = findUriByRef(getWorkspaceCache().markdownUris, refStr)?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(label || refStr);
        }

        return getRefAnchor(getFileUrlForMarkdownPreview(markdownUri), label || refStr);
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[([^\[\]]+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const markdownUri = findUriByRef(getWorkspaceCache().markdownUris, refStr)?.fsPath;

        if (!markdownUri) {
          return getInvalidRefAnchor(label || refStr);
        }

        return getRefAnchor(getFileUrlForMarkdownPreview(markdownUri), label || refStr);
      },
    });
};

export default extendMarkdownIt;
