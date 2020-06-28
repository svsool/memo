# Memo

Markdown knowledge base with bidirectional links. Inspired by Obsidian.md and RoamResearch.

## Features

- Notes and images autocomplete on typing `[[my note]]` or `![[image.png]]`
- Images preview via markdown preview
- Creating notes automatically from non-existing links
- Automatic links synchronization on file move / rename
- Support for absolute and short links support in case of non-unique filename across workspace
- Support for link with label `[[your link|your label]]`, it will be rendered as link with `your label` in markdown preview
- Image and note preview on hovering a link in the text editor
- Opening note or image from link in markdown preview
- Backlinks panel
- "Open today note" command
- "Open random note command" for exploring already existing notes

## Development

* `cd <project-root> && yarn`
* Open project in VSCode using `code <project-root>` or via `File -> Open...` and press `F5` to open a new window with the extension loaded.
* Set breakpoints in your code inside `src/extension.ts` to debug the extension.
* Find output from the extension in the debug console.

## Run tests

```
yarn test
```
