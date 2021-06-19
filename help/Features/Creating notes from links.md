# Creating notes from links

You can automatically create a `[[Note]]` if does not exist yet just by clicking on the link using `cmd / ctrl + click` or using VSCode built-in "Open Link" command ![[Open link command.png]] which you can bind to a keyboard shortcut.

## Link formats

Memo supports two link formats, `short` (by default) and `long`.

```json
// settings.json
{
  "memo.links.format": "long"
}
  ```

### Short links

Short links are helpful for hierarchy-free knowledge bases where the path itself doesn't bring a lot of context.

Memo will try to use `short` links whenever possible and fallback to the `long` ones otherwise. Learn next how it works.

1. Workspace tree where `note.md` is a unique name:

```
<root>
└── folder1
    └── folder2
        └── note.md
```

In this case on typing `[[not` autocomplete will offer only one result and Memo will insert a `[[note]]` link pointing to `<root>/folder1/folder2/note.md`.

2. Workspace tree where `note.md` is not a unique name:

```
<root>
├── folder1
│   └── folder2
│       └── note.md
└── note.md
```

Autocomplete results on typing `[[not` in the editor:
1. note.md
1. folder1/folder2/note.md

Autocomplete results are pre-sorted using a path sorting algorithm. For example, in this case `note.md` path comes before `folder1/folder2/note.md` because shallow paths are sorted before deep ones.

On picking (1) item Memo will insert a `short` link `[[note]]` pointing to `<root>/note.md` file.

On picking (2) item Memo will insert a `long` link pointing to `[[folder1/folder2/note]]` file.

Mixing short and long link behaviors helps to avoid clashes, however, long links shouldn't be pervasive with hierarchy-free knowledge bases, and short links prevalent instead.

### Long links

Unlike short links long links always use the longest possible path.

Workspace tree:

```
<root>
├── folder1
│   ├── folder2
│   │   └── note.md
│   └── note.md
└── note.md
```

Autocomplete results on typing `[[not` in the editor:
1. note.md
1. folder1/note.md
1. folder1/folder2/note.md

This is what Memo will insert on picking items accordingly:

1. `[[note]]`
1. `[[folder1/note]]`
1. `[[folder1/folder2/note]]`

## Link rules

Memo supports configurable rules for short links to specify the destination of the newly created notes when you are clicking on the link.
It enables the concept of an inbox, from which the user can decide the notes' final location.

The following snippet would instruct Memo to create daily notes in `Daily` directory and all other notes in `Notes` upon clicking on a short link in the editor.
  ```json
// settings.json
{
    "memo.links.rules": [
      {
        "rule": "([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))\\.md$",
        "comment": "Daily notes yyyy-mm-dd",
        "folder": "/Daily"
      },
      {
        "rule": "\\.md$",
        "comment": "All other notes",
        "folder": "/Notes"
      }
    ]
}
  ```
