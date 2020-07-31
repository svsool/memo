# Change Log

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
https://github.com/svsool/vscode-memo/compare/v0.1.12...HEAD

## [v0.1.12] - 2020-07-31
### Added

- Add `webp` extension support
- Add tooltip about unknown extensions to built-in preview

### Fixed
- Links within code spans and fenced code blocks are not interpreted anymore during links rename and in the backlinks panel
- New [known extensions](https://github.com/svsool/vscode-memo/blob/7643221ae1b8884e02af375af2696c4918fcd285/src/utils/utils.ts#L19) are now recognized on drag and drop to project explorer

### Removed
- Remove `memo.useEnhancedTriggerSuggest` setting in favor of built-in `"[markdown]": { "editor.quickSuggestions": true }`

## [v0.1.11] - 2020-07-26
### Added
- Add new "Open daily note" command

### Removed
- Remove "Open today's note" command in favor of more flexible "Open daily note" command

## [v0.1.10] - 2020-07-24
### Added
- Add new help document "Open link in the default app"
- Add Memo logo for VSCode Marketplace

### Changed
- Better documentation for "Accepted File Formats" in the help
- Added information about links rename via "Rename Symbol" command to "Automatic link synchronization" document in the help

## [v0.1.9] - 2020-07-23
### Added
- Add "Open link in the default app" command. Opening link via context menu is also supported
- Add the possibility to rename links using `F2` or `Rename symbol` command. Renaming via context menu is also supported

### Fixed
- Fix bug when hover was not available for long references in Windows

## [v0.1.8] - 2020-07-13
### Added
- Embedding other notes using `![[Your note]]` syntax
- Support regular links to images `[[image.png]]`, previously it was only possible to refer to an image using embed link `![[image.png]]`
- Add `memo.useEnhancedTriggerSuggest` setting that instructs Memo to continuously trigger suggest after `[[` characters typed, so it makes easier to re-trigger suggest if you made a mistake while typing
- Embed files feature added to help documentation
### Fixed
- Regular and embed links won't be interpreted anymore within code span and fenced code blocks. So you can use it for escaping links and rendering them as is.

## [v0.1.7] - 2020-07-08
### Fixed
- Fix backlinks lookup for filenames with special characters

## [v0.1.6] - 2020-07-08
### Added
- Creating a note from a long link even when folder does not exist

## [v0.1.5] - 2020-07-07
### Fixed
- Fix links resolution in the built-in preview. Sometimes links were not referring to a correct file.

## [v0.1.4] - 2020-07-06
### Added
- Publishing via CI
### Fixed
- Fix opening a note via a short link when note and image share the same name

## [v0.1.1] - 2020-07-05
### Added
- Help docs
- Features demo in README.md
- Hover hint for links referring to nonexistent files

## [v0.1.0] - 2020-07-04
### Added
- Links support
  - Creating links
  - Links navigation on `cmd+click` for macOS or `ctrl+click` for Windows
  - Automatic links synchronization on file rename
  - Support for short and full links if filename is not unique in the workspace
- Notes & images preview in the built-in Markdown preview or on hovering a link
- Creating notes on the fly from the links that are not created yet to the filesystem
- Simple backlinks panel
- Two new commands added
  - Open today's note command — creates a note with a title in this format `yyyy-mm-dd` or opens already existing one
  - Open random note — allows you to explore your knowledge base a little bit
