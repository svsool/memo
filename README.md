# Memo

Markdown knowledge base with bidirectional [[link]]s built on top of [VSCode](https://github.com/microsoft/vscode).

Inspired by [Obsidian.md](https://obsidian.md/) and [RoamResearch](https://roamresearch.com/).

[![](https://vsmarketplacebadge.apphb.com/version-short/svsool.markdown-memo.svg)](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo)
[![](https://vsmarketplacebadge.apphb.com/installs/svsool.markdown-memo.svg)](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo)
[![](https://vsmarketplacebadge.apphb.com/rating-short/svsool.markdown-memo.svg)](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo&ssr=false#review-details)
[![](https://github.com/svsool/vscode-memo/workflows/CI/badge.svg?branch=master)](https://github.com/svsool/vscode-memo/actions?query=workflow%3ACI+branch%3Amaster)
[![codecov](https://codecov.io/gh/svsool/vscode-memo/branch/master/graph/badge.svg)](https://codecov.io/gh/svsool/vscode-memo)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/svsool/vscode-memo/blob/master/CONTRIBUTING.md)

## Why?

Because your knowledge base deserves to be powered by open source. Read more [here](https://github.com/svsool/vscode-memo/issues/9#issuecomment-658893538).

## Getting started

If you want to try out Memo just install it via marketplace using [this link](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo) and open the [help](https://github.com/svsool/vscode-memo/tree/master/help) folder in VSCode.

## Features

- 🔗 **Links support**

  - Creating links

    - ![Creating links](./help/Attachments/Creating%20links.gif)

  - Links navigation

    - ![Links navigation](./help/Attachments/Links%20navigation.gif)

  - Embedding notes and images

    - ![Embedding notes and images](./help/Attachments/Embed%20files.gif)

  - Automatic links synchronization on file rename

    - ![Automatic links synchronization](./help/Attachments/Automatic%20link%20synchronization.gif)

  - Links rename via `Rename Symbol` command

    - ![Links rename via command](./help/Attachments/Automatic%20link%20synchronization%202.gif)

  - Links labeling

    - ![Links labeling](./help/Attachments/Links%20labeling.png)

  - Support for short and full links on filename clash

    - ![Support short and full links on filename clash](./help/Attachments/Short%20and%20long%20links%20support%202.png)

  - Opening links with unsupported file formats in the system default app

    - ![Links labeling](./help/Attachments/Opening%20links%20in%20the%20default%20app.gif)

  - Find all references

    - ![Find all references](./help/Attachments/Find%20all%20references.png)

- 🖼️ **Notes and images preview (built-in & on-hover)**

![Notes and images preview](./help/Attachments/Notes%20and%20images%20preview.gif)

- 🦋 **Creating notes on the fly**

![Creating notes on the fly](./help/Attachments/Creating%20notes%20from%20links.png)

- 🖇 **Backlinks panel**

![Backlinks panel](./help/Attachments/Backlinks%20panel.png)

- 🕹 **Commands**

  - "Open link" command support for links following

  - "Open link to the side" command which allows you to open link in the adjacent/new column of the editor

  - "Open daily note" command which creates a note with a title in `yyyy-mm-dd` format or opens already existing one

    - ![Open daily note command](./help/Attachments/Open%20daily%20note.gif)

  - "Open random note" command which allows you to explore your knowledge base a little bit

    - ![Open random note command](./help/Attachments/Open%20random%20note.gif)

  - "Open link in the default app" command for opening unsupported file formats in the system default app

  - "Rename Symbol" command support for renaming links right in the editor

## FAQ

- [Memo vs Foam](https://github.com/svsool/vscode-memo/issues/9#issuecomment-658346216)
- [Memo vs Obsidian](https://github.com/svsool/vscode-memo/issues/1#issuecomment-655004112)
- How to follow link on `cmd+enter` or `ctrl+enter` like in Obsidian?
  - Bind built-in `editor.action.openLink` command to `cmd+enter` ([see example](https://github.com/svsool/vscode-memo/issues/2#issuecomment-654981827)) or use `cmd+click` on the link
- [Pasting images from clipboard](./help/How%20to/Pasting%20images%20from%20clipboard.md)
- [Pasting HTML as Markdown](./help/How%20to/Pasting%20HTML%20as%20Markdown.md)
- Memo missing some feature? Please consider exploring other Markdown plugins from VS Marketplace first. There are [plenty of them](https://marketplace.visualstudio.com/search?term=markdown&target=VSCode&category=All%20categories&sortBy=Relevance).

## Contributing

- File bugs, feature requests in [GitHub Issues](https://github.com/svsool/vscode-memo/issues).
- Leave a review on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo&ssr=false#review-details).
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contributing to the code base.

## Changelog

See changelog [here](CHANGELOG.md).
