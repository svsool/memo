# Accepted File Formats

Memo recognizes the following file formats:

1. Markdown files: `md`;
2. Image files: `png`, `jpg`, `jpeg`, `svg`, `gif`, `webp`;
3. Other formats: `doc`, `docx`, `rtf`, `txt`, `odt`, `xls`, `xlsx`, `ppt`, `pptm`, `pptx`, `pdf`. See full list of extensions [here](https://github.com/svsool/memo/blob/51d65f594978d30ee049feda710c3ce52ab64bad/src/utils/utils.ts#L12-L44).

Markdown files and image files can be referenced via regular links `[[image.png]]` or attached using embed links `![[image.png]]`. These file types also support on-hover and built-in previews ([[Notes and images preview.gif|see how it works]]).

Other formats can be referenced via regular links and opened in VSCode given plugin in the marketplace such as for instance [vscode-pdf](https://marketplace.visualstudio.com/items?itemName=tomoki1207.pdf) for PDFs or opened in the default app using `Open link in the default app` command. See [[Opening links in the default app]].
