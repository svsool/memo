# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.18](https://github.com/svsool/vscode-memo/compare/v0.3.17...v0.3.18) (2022-01-29)


### Bug Fixes

* Avoid searching if workspace folder not present ([4f39b0d](https://github.com/svsool/vscode-memo/commit/4f39b0d93b607795aa6c76f870db251c92c3c3ef))

### [0.3.17](https://github.com/svsool/vscode-memo/compare/v0.3.16...v0.3.17) (2022-01-08)


### Features

* Use rigrep to speed up refs rename ([#286](https://github.com/svsool/vscode-memo/issues/286)) ([284d06f](https://github.com/svsool/vscode-memo/commit/284d06f3f4eb673e47f767aa212c2e26b277e839))

### [0.3.16](https://github.com/svsool/vscode-memo/compare/v0.3.15...v0.3.16) (2021-12-19)


### Features

* Support vars and capturing group in link rules ([#469](https://github.com/svsool/vscode-memo/issues/469)) ([259ba76](https://github.com/svsool/vscode-memo/commit/259ba767bd74240501e448fb13f37c9318b949ee))

### [0.3.15](https://github.com/svsool/vscode-memo/compare/v0.3.14...v0.3.15) (2021-12-18)


### Bug Fixes

* Fix "Paste HTML as Markdown" command ([8c324f8](https://github.com/svsool/vscode-memo/commit/8c324f88b004c987b0b3ea814f4c19c4770a1399))

### [0.3.14](https://github.com/svsool/vscode-memo/compare/v0.3.13...v0.3.14) (2021-12-18)


### Bug Fixes

* Disable "Paste HTML as Markdown" command until fixed ([45c4e1d](https://github.com/svsool/vscode-memo/commit/45c4e1d142519273df82c9feffb0254f221f1074))

### [0.3.13](https://github.com/svsool/vscode-memo/compare/v0.3.12...v0.3.13) (2021-12-18)


### Features

* Add "Extract range to a new note" command ([da3074a](https://github.com/svsool/vscode-memo/commit/da3074a11a21144812b3c735f6b77170067f171b))
* Add "Paste HTML as Markdown" command ([501b48b](https://github.com/svsool/vscode-memo/commit/501b48bb0da6154d462e10c87384e7d07e85e4f2))

### [0.3.12](https://github.com/svsool/vscode-memo/compare/v0.3.11...v0.3.12) (2021-12-18)

### [0.3.11](https://github.com/svsool/vscode-memo/compare/v0.3.10...v0.3.11) (2021-12-18)


### Features

* **completion:** Add note and images preview to the link completion popup ([#472](https://github.com/svsool/vscode-memo/issues/472)) ([92a16bd](https://github.com/svsool/vscode-memo/commit/92a16bd70c5ebc78bdfc19e4c9fa3ebfe223d0a6))

### [0.3.10](https://github.com/svsool/vscode-memo/compare/v0.3.9...v0.3.10) (2021-12-12)


### Bug Fixes

* Fix links in markdown preview ([#481](https://github.com/svsool/vscode-memo/issues/481)) ([0c2cb34](https://github.com/svsool/vscode-memo/commit/0c2cb348d5001855cb910998e51df36aeee4b325))

### [0.3.9](https://github.com/svsool/vscode-memo/compare/v0.3.8...v0.3.9) (2021-06-19)


### Features

* Support configurable location for creating notes ([#331](https://github.com/svsool/vscode-memo/pull/331))

### Bug Fixes

* Fix links in markdown preview in the latest vscode ([#367](https://github.com/svsool/vscode-memo/issues/367), [#401](https://github.com/svsool/vscode-memo/issues/401)) ([4c3f630](https://github.com/svsool/vscode-memo/commit/4c3f630481d6c606810e098536aadba411f38433))

### [0.3.8](https://github.com/svsool/vscode-memo/compare/v0.3.7...v0.3.8) (2021-04-30)

### [0.3.7](https://github.com/svsool/vscode-memo/compare/v0.3.6...v0.3.7) (2021-04-27)


### Bug Fixes

* Fix findUriByRef for long links with dots ([#346](https://github.com/svsool/vscode-memo/issues/346), [#339](https://github.com/svsool/vscode-memo/issues/339)) ([6ec7cca](https://github.com/svsool/vscode-memo/commit/6ec7ccaad17cf5e2686d61f1ed3c49d5d53043d2))

### [0.3.6](https://github.com/svsool/vscode-memo/compare/v0.3.5...v0.3.6) (2021-04-24)

### [0.3.5](https://github.com/svsool/vscode-memo/compare/v0.3.4...v0.3.5) (2021-04-24)


### Bug Fixes

* Re-enable image preview on hover in latest vscode versions ([abce6b9](https://github.com/svsool/vscode-memo/commit/abce6b9858d1336516385e2a4fc1e88940be6168))

### [0.3.4](https://github.com/svsool/vscode-memo/compare/v0.3.3...v0.3.4) (2021-03-20)


### Bug Fixes

* Add a note about degraded experience on image hover with vscode 1.53/1.54 ([cd085f9](https://github.com/svsool/vscode-memo/commit/cd085f935ce36cb91a4f58dd5d373d17004dec31))
* Fix backlink error when filenames contain regex symbols ([06bd81d](https://github.com/svsool/vscode-memo/commit/06bd81db9ddf4547654a88b2de2a850be302773e))
* Make follow link to work with vscode 1.53/1.54 ([b60258e](https://github.com/svsool/vscode-memo/commit/b60258eff4ab54cf7d1d59f6f6cb8f2025083e83))

### [0.3.3](https://github.com/svsool/vscode-memo/compare/v0.3.2...v0.3.3) (2021-01-24)


### Features

* Add context menu "Open menu to the side" ([618eadd](https://github.com/svsool/vscode-memo/commit/618eadd1e2c09af0470dd9c3612f241234679c85))
* Add memo:refFocusedOrHovered ([9ce62a6](https://github.com/svsool/vscode-memo/commit/9ce62a6b6d1bf619eb1cd9dff33c5bcb1d5b83d5))
* open link in adjacent/new editor column ([#81](https://github.com/svsool/vscode-memo/issues/81)) ([8c9c260](https://github.com/svsool/vscode-memo/commit/8c9c260d136a0d900ff223ad18ffb61cd5fe398a))


### Bug Fixes

* add showOption ([c1d3066](https://github.com/svsool/vscode-memo/commit/c1d3066c349037497efdadc33f1546d18c899e32))
* eslint error "Delete `CR` on Windows ([7cfad0f](https://github.com/svsool/vscode-memo/commit/7cfad0f46aa5b4cbaa0494c33271625495b6ea3e))
* Fix tests for openReferenceBeside ([1050a94](https://github.com/svsool/vscode-memo/commit/1050a9416023620d1a0905c9b31fb2d3baed5fee))
* remove space ([4945f95](https://github.com/svsool/vscode-memo/commit/4945f95187cbb91167ad2fa10852b75a6e39fd38))

### [0.3.1](https://github.com/svsool/vscode-memo/compare/v0.3.0...v0.3.1) (2020-12-06)


### Bug Fixes

* Fix long ref backlinks ([#209](https://github.com/svsool/vscode-memo/issues/209)) ([b6f2ac1](https://github.com/svsool/vscode-memo/commit/b6f2ac16ed003879d7e2507db1169200ea5017c3))

## [0.3.0](https://github.com/svsool/vscode-memo/compare/v0.2.2...v0.3.0) (2020-10-31)


### ⚠ BREAKING CHANGES

* Rename config prop memo.linksOnHoverPreview.imageMaxHeight -> memo.links.preview.imageMaxHeight

### Features

* Adds flag for syntax decorations ([6bad403](https://github.com/svsool/vscode-memo/commit/6bad403ac3577271804e8f0cee6f48822da0244e))
* Make most of the features disableable ([#167](https://github.com/svsool/vscode-memo/issues/167)) ([643824e](https://github.com/svsool/vscode-memo/commit/643824ebf6c8e42a48b144af0e95948fc77d410c))
* Support links.format = absolute on file rename ([fe6b569](https://github.com/svsool/vscode-memo/commit/fe6b5697e1263224c6f63ec2c54d30bdd15d74e4))


### Bug Fixes

* Fix replacing multiple links at once ([2d70222](https://github.com/svsool/vscode-memo/commit/2d70222d10b5abd6a4a2b91cc6d0af7d94f8380d))
* Properly handle escape symbol for piped links ([#164](https://github.com/svsool/vscode-memo/issues/164)) ([df899d1](https://github.com/svsool/vscode-memo/commit/df899d118973fb84d82e4e6f2a73500658c78132))
* remove errant only ([15231d6](https://github.com/svsool/vscode-memo/commit/15231d6b5e38030243d4e40db45d13155d845966))

### [0.2.2](https://github.com/svsool/vscode-memo/compare/v0.2.1...v0.2.2) (2020-09-27)


### Bug Fixes

* Remove requirement `refUnderCursorExists` when using keyboard shortcut to follow a link [#127](https://github.com/svsool/vscode-memo/issues/127) ([fffb0e3](https://github.com/svsool/vscode-memo/commit/fffb0e3391e07ad4a22f05e01acc80d12040f7dd))

### [0.2.1](https://github.com/svsool/vscode-memo/compare/v0.2.0...v0.2.1) (2020-09-20)


### Bug Fixes

* Infer previous extension on renaming to unknown extension [#120](https://github.com/svsool/vscode-memo/issues/120) ([1aad3f0](https://github.com/svsool/vscode-memo/commit/1aad3f0ee87834db2462e7ec643cbfcab1162cb9))

## [0.2.0](https://github.com/svsool/vscode-memo/compare/v0.1.14...v0.2.0) (2020-09-20)


### ⚠ BREAKING CHANGES

* memo.imagePreviewMaxHeight -> memo.imagePreviewMaxHeight
memo.collapseBacklinksPanelItems -> memo.backlinksPanel.collapseParentItems

### Features

* Take search.exclude and file.exclude settings into account when caching workspace [#116](https://github.com/svsool/vscode-memo/issues/116) ([81643ae](https://github.com/svsool/vscode-memo/commit/81643ae0194ff5093f69a6f422406172a5afbae1))


### Bug Fixes

* Change backlinks panel id namespace to align with settings ([4e9e112](https://github.com/svsool/vscode-memo/commit/4e9e1121f5192179ebc22a757cc4ca5ff32466f9))


* Rename configuration options ([ddfcafd](https://github.com/svsool/vscode-memo/commit/ddfcafd7b19992c4e3ffd7ff330acec1fbba6137))

### [0.1.14](https://github.com/svsool/vscode-memo/compare/v0.1.13...v0.1.14) (2020-08-09)


### Features

* **autocomplete:** Support autocomplete of dangling refs ([1d0fefa](https://github.com/svsool/vscode-memo/commit/1d0fefa33c1b6043dff66e678004401038ab66c9))


### Bug Fixes

* Don't add extra md extension if link has an extension ([4cb7436](https://github.com/svsool/vscode-memo/commit/4cb7436e655e294ebb1462a772b3dc5b3273d4d2))
* Fix findReferences regexp greediness ([c5a976e](https://github.com/svsool/vscode-memo/commit/c5a976eee3643b9b4d9e1223ac8cc0fe4e53f820))
* Fix findUriByRef logic to use relative paths ([a6dbd2c](https://github.com/svsool/vscode-memo/commit/a6dbd2c38af470499e364f29425eb82a0df51b6c))
* Fix path passed to del.sync in cleanWorkspace utility ([f60575c](https://github.com/svsool/vscode-memo/commit/f60575c2d1a749bf9817f0dabfdc16e6d9ee1db8))
* Make links working better with dot files and explicit md extension in the link ([51d65f5](https://github.com/svsool/vscode-memo/commit/51d65f594978d30ee049feda710c3ce52ab64bad))

### [0.1.13](https://github.com/svsool/vscode-memo/compare/v0.1.12...v0.1.13) (2020-08-01)

### [0.1.12](https://github.com/svsool/vscode-memo/compare/v0.1.11...v0.1.12) (2020-07-31)

### Added

- Add `webp` extension support
- Add tooltip about unknown extensions to built-in preview

### Fixed
- Links within code spans and fenced code blocks are not interpreted anymore during links rename and in the backlinks panel
- New [known extensions](https://github.com/svsool/vscode-memo/blob/7643221ae1b8884e02af375af2696c4918fcd285/src/utils/utils.ts#L19) are now recognized on drag and drop to project explorer

### Removed
- Remove `memo.useEnhancedTriggerSuggest` setting in favor of built-in `"[markdown]": { "editor.quickSuggestions": true }`

### [0.1.11](https://github.com/svsool/vscode-memo/compare/v0.1.10...v0.1.11) (2020-07-26)

### Added
- Add new "Open daily note" command

### Removed
- Remove "Open today's note" command in favor of more flexible "Open daily note" command

### [0.1.10](https://github.com/svsool/vscode-memo/compare/v0.1.9...v0.1.10) (2020-07-24)

### Added
- Add new help document "Open link in the default app"
- Add Memo logo for VSCode Marketplace

### Changed
- Better documentation for "Accepted File Formats" in the help
- Added information about links rename via "Rename Symbol" command to "Automatic link synchronization" document in the help

### [0.1.9](https://github.com/svsool/vscode-memo/compare/v0.1.8...v0.1.9) (2020-07-23)

### Added
- Add "Open link in the default app" command. Opening link via context menu is also supported
- Add the possibility to rename links using `F2` or `Rename symbol` command. Renaming via context menu is also supported

### Fixed
- Fix bug when hover was not available for long references in Windows

### [0.1.8](https://github.com/svsool/vscode-memo/compare/v0.1.7...v0.1.8) (2020-07-13)

### Added
- Embedding other notes using `![[Your note]]` syntax
- Support regular links to images `[[image.png]]`, previously it was only possible to refer to an image using embed link `![[image.png]]`
- Add `memo.useEnhancedTriggerSuggest` setting that instructs Memo to continuously trigger suggest after `[[` characters typed, so it makes easier to re-trigger suggest if you made a mistake while typing
- Embed files feature added to help documentation

### Fixed
- Regular and embed links won't be interpreted anymore within code span and fenced code blocks. So you can use it for escaping links and rendering them as is.

### [0.1.7](https://github.com/svsool/vscode-memo/compare/v0.1.6...v0.1.7) (2020-07-08)

### Fixed
- Fix backlinks lookup for filenames with special characters

### [0.1.6](https://github.com/svsool/vscode-memo/compare/v0.1.5...v0.1.6) (2020-07-08)

### Added
- Creating a note from a long link even when folder does not exist

### [0.1.5](https://github.com/svsool/vscode-memo/compare/v0.1.4...v0.1.5) (2020-07-07)

### Fixed
- Fix links resolution in the built-in preview. Sometimes links were not referring to a correct file.

### [0.1.4](https://github.com/svsool/vscode-memo/compare/v0.1.1...v0.1.4) (2020-07-06)

### Added
- Publishing via CI

### Fixed
- Fix opening a note via a short link when note and image share the same name

### [0.1.1](https://github.com/svsool/vscode-memo/compare/v0.1.0...v0.1.1) (2020-07-05)

### Added
- Help docs
- Features demo in README.md
- Hover hint for links referring to nonexistent files

## 0.1.0 (2020-07-04)

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
