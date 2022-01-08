# Short and long (relative to workspace root) links support

In case when you have a few notes with the same filename in different directories Memo supports short and long links.

For example, `Examples/Demo (Non-Unique)` folder in the help directory has the following structure:

```
├── Examples
│   └── Demo (Non-Unique)
│       ├── DemoNote.md
│       └── Notes
│           └── DemoNote.md
```

If you want to link `DemoNote.md (#1)` Memo will use a short link like following [[DemoNote]], because this link comes first in the autocomplete results.

![[Short and long links support.png]]

And if you want to link `DemoNote.md (#2)` Memo will use a long link like following [[Examples/Demo (Non-Unique)/Notes/DemoNote]].

This simple assumption helps to make links shorter in most cases.
