# Pasting images from clipboard

For pasting images from clipboard you can install and use [vscode-paste-image](https://github.com/mushanshitiancai/vscode-paste-image). Thanks to VSCode Marketplace and the author of vscode-paste-image 💙.

Example of `settings.json` for embedding images using `![[2020-08-12-20-11-46.png]]` format and saving them in `Attachments` folder automatically:

```json
{
  "pasteImage.insertPattern": "![[${imageFileName}]]",
  "pasteImage.path": "${projectRoot}/Attachments"
}
```

After configuring vscode-paste-image extension, just copy some image and execute `Paste image` from the command palette and you are good to go 👍. You can create a shortcut for this command as well!
