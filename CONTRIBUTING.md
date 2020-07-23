# Contribution guidelines

## Project structure

```
src
 ├── commands - contains internal / external commands, e.g. open today or random note commands
 ├── declarations.d.ts - global TS type declarations
 ├── extension.ts - plugin entrypoint
 ├── extensions - contains extensions, usually extension accepts plugin context and implements certain functionality
 ├── test - contains test runner and common test utils
 ├── types.ts - common types
 └── utils - common utils
```

## Contributing

1. Fork this repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Development

* `cd <project-root> && yarn && yarn watch`
* Open project in VSCode using `code <project-root>` or via `File -> Open...` and press `F5` to open a new window with the extension loaded.
* After making modifications run `Developer: Restart Extension Host` command from the command palette to restart the extension and quickly pick up your changes.
* Set breakpoints in your code inside `src/extension.ts` to debug the extension.
* Find output from the extension in the debug console.

## Run tests

Before running tests please ensure all VSCode instances closed since it's integration tests.

```
yarn test
```

## Releasing

1. Bump version using [semver](https://semver.org/) and yarn built-in commands either `yarn version --patch`, `yarn version --minor` or `yarn version --major`
    - Patch update for bug fixes, dependency updates and small changes
    - Minor update for features and bigger changes in a backwards compatible manner
    - Major update for features with incompatible API changes
1. Push to origin with `git push && git push --tags`
1. CI will automatically create new release with changes since the last release, it will also attach release artifacts and publish extension to the marketplace

## Conventions

General:

- Use random file names in tests to increase isolation
  - VSCode does not provide API to dispose text documents manually which can lead to flaky tests if random file names are not used
- Use "_" prefix for internal command names
- Put tests as `<filename>.spec.ts` next to the tested file

Pull requests:

- No linter or type errors
- No failing tests
- Try to make code better than it was before the pull request
