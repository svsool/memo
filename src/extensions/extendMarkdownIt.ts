import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';
import path from 'path';
import fs from 'fs';

import {
  getWorkspaceCache,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
  containsImageExt,
  findUriByRef,
  extractEmbedRefs,
} from '../utils';

const getInvalidRefAnchor = (text: string) =>
  `<a data-invalid-ref style="color: #cc0013; cursor: not-allowed;" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${href}" href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  const refsStack: string[] = [];

  const mdExtended = md
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

        const fsPath = findUriByRef(getWorkspaceCache().markdownUris, refStr)?.fsPath;

        if (!fsPath) {
          return getInvalidRefAnchor(label || refStr);
        }

        const name = path.parse(fsPath).name;

        const content = fs.readFileSync(fsPath).toString();

        const refs = extractEmbedRefs(content).map((ref) => ref.toLowerCase());

        const cyclicLinkDetected =
          refs.includes(refStr.toLowerCase()) || refs.some((ref) => refsStack.includes(ref));

        if (!cyclicLinkDetected) {
          refsStack.push(refStr.toLowerCase());
        }

        const html = `<div class="memo-markdown-embed">
          <div class="memo-markdown-embed-title">${name}</div>
          <div class="memo-markdown-embed-link">
            <a title="${fsPath}" href="${fsPath}">
              <i class="icon-link"></i>
            </a>
          </div>
          <div class="memo-markdown-embed-content">
            ${
              !cyclicLinkDetected
                ? (mdExtended as any).render(content, undefined, true)
                : '<div style="text-align: center">Cyclic linking detected 💥.</div>'
            }
          </div>
        </div>`;

        if (!cyclicLinkDetected) {
          refsStack.pop();
        }

        return html;
      },
    })
    .use(markdownItRegex, {
      name: 'ref-document',
      regex: /\[\[([^\[\]]+?)\]\]/,
      replace: (ref: string) => {
        const [refStr, label = ''] = ref.split('|');

        const fsPath = findUriByRef(getWorkspaceCache().allUris, refStr)?.fsPath;

        if (!fsPath) {
          return getInvalidRefAnchor(label || refStr);
        }

        const url = getFileUrlForMarkdownPreview(fsPath);

        return getRefAnchor(url, label || refStr);
      },
    });

  return mdExtended;
};

export default extendMarkdownIt;
