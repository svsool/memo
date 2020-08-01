# Contribution guidelines

## Project structure

```
src
 ├── commands - contains internal / external commands, e.g. open today or random note commands
 ├── declarations.d.ts - global TS type declarations
 ├── extension.ts - plugin entrypoint
 ├── features - contains features, usually feature accepts plugin context and implements certain functionality
 ├── test - contains test runner and common test utils
 ├── types.ts - common types
 └── utils - common utils
```

## Committing changes

See [Conventional Commits](https://conventionalcommits.org) for commit guidelines and [Why Use Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#why-use-conventional-commits).

Guidelines enforced via commit hooks, so commits MUST be prefixed with a type.

## Contributing

1. Fork this repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'feat: Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Development

* `cd <project-root> && yarn && yarn watch`
* Open project in VSCode using `code <project-root>` or via `File -> Open...` and press `F5` to open a new window with the extension loaded.
* After making modifications run `Developer: Restart Extension Host` command from the command palette to restart the extension and quickly pick up your changes.
* Set breakpoints in your code inside `src/extension.ts` to debug the extension.
* Find output from the extension in the debug console.

## Run tests

```
yarn test
```

*Note: Before running integration tests, please ensure that all VSCode instances are closed.*

## Releasing

*You can skip this section if your contribution comes via PR from a forked repository.*

1. Remember to update [new version notifications](https://github.com/svsool/vscode-memo/blob/2d187fd65218473c4264e992aa4a2497666614f2/src/features/newVersionNotifier.ts#L6) if needed
1. Run `yarn release`
1. Push to origin with `git push --follow-tags origin master`
1. After push CI will automatically:
    - create new release
    - attach release artifacts
    - publish extension to the marketplace

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
