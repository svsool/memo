# Memo

Markdown knowledge base with first class bidirectional links

## Get up and running straight away

* Press `F5` to open a new window with your extension loaded.
* Set breakpoints in your code inside `src/extension.ts` to debug your extension.
* Find output from your extension in the debug console.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.ts` or create new test files inside the `test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.


## MVP Roadmap

- refs highlights in editor and in preview
- refs should be openable in editor and in preview
- refs autocomplete / tagger
- backlinks panel
- tags panel
