# Memo

Markdown knowledge base with bidirectional links. Inspired by Obsidian.md and RoamResearch.

## Features

- Links and images autocomplete on typing `[[my note]]`
- Embedding images via `![[image.png]]`
- Refs and images preview via markdown preview
- Creating notes automatically from non-existing links
- "Open today note" command
- "Open random note command" for exploring already existing notes
- Automatic links synchronization on file move / rename
- Absolute and short links support in case of non-unique filename across workspace
- Ref labels `[[your ref|your label]]`, it will be rendered as link with `your label` text in markdown preview
- Image and note preview on hovering a link in the text editor
- Opening note or image from markdown preview
- Backlinks panel

## Development

* `cd <project-root> && yarn`
* Open project in VSCode using `code <project-root>` or via `File -> Open...` and press `F5` to open a new window with the extension loaded.
* Set breakpoints in your code inside `src/extension.ts` to debug the extension.
* Find output from the extension in the debug console.

## Run tests

```
yarn test
```
