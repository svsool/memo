import vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import markdownItRegex from 'markdown-it-regex';
import path from 'path';
import fs from 'fs';

import {
  getWorkspaceCache,
  getImgUrlForMarkdownPreview,
  getFileUrlForMarkdownPreview,
  containsImageExt,
  containsUnknownExt,
  findUriByRef,
  extractEmbedRefs,
  parseRef,
  commonExtsHint,
} from '../utils';

const getInvalidRefAnchor = (text: string) =>
  `<a class="memo-invalid-link" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getUnknownExtRefAnchor = (text: string, ref: string) =>
  `<a class="memo-invalid-link" title="Link contains unknown extension: ${
    path.parse(ref).ext
  }. Please use common file extensions ${commonExtsHint} to enable full support." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${href}" href="${href}" data-href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  const refsStack: string[] = [];
  const file = !!vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName : '';

  const mdExtended = md
    .use(markdownItRegex, {
      name: 'ref-resource',
      regex: /!\[\[([^\[\]]+?)\]\]/,
      replace: (rawRef: string) => {
        const { ref, label } = parseRef(rawRef);

        if (containsImageExt(ref)) {
          const imagePath = findUriByRef(getWorkspaceCache().imageUris, ref, file)?.fsPath;

          if (imagePath) {
            return `<div><img src="${getImgUrlForMarkdownPreview(
              imagePath,
            )}" data-src="${getImgUrlForMarkdownPreview(imagePath)}" alt="${
              label || ref
            }" /></div>`;
          }
        }

        const fsPath = findUriByRef(getWorkspaceCache().markdownUris, ref, file)?.fsPath;

        if (!fsPath && containsUnknownExt(ref)) {
          return getUnknownExtRefAnchor(label || ref, ref);
        }

        if (!fsPath || !fs.existsSync(fsPath)) {
          return getInvalidRefAnchor(label || ref);
        }

        const name = path.parse(fsPath).name;

        const content = fs.readFileSync(fsPath).toString();

        const refs = extractEmbedRefs(content).map((ref) => ref.toLowerCase());

        const cyclicLinkDetected =
          refs.includes(ref.toLowerCase()) || refs.some((ref) => refsStack.includes(ref));

        if (!cyclicLinkDetected) {
          refsStack.push(ref.toLowerCase());
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
                : '<div class="memo-cyclic-link-warning">Cyclic linking detected 💥.</div>'
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
      replace: (rawRef: string) => {
        const { ref, label } = parseRef(rawRef);

        const fsPath = findUriByRef(getWorkspaceCache().allUris, ref, file)?.fsPath;

        if (!fsPath && containsUnknownExt(ref)) {
          return getUnknownExtRefAnchor(label || ref, ref);
        }

        if (!fsPath) {
          return getInvalidRefAnchor(label || ref);
        }

        return getRefAnchor(getFileUrlForMarkdownPreview(fsPath), label || ref);
      },
    });

  return mdExtended;
};

export default extendMarkdownIt;
