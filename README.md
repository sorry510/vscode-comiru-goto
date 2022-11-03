## comiru-goto README

support render goto view
support view goto html, js, css
support m.xx goto model

1. ctrl(cmd) + click to the file.
2. hover show the link to the file.

## BUG

>if words has link，new link is invalid, so i use hover instead

example: vscode in html file built-in link will make this extension link invalid

```
<script src="{{ asset('/js/test.js') }}"></script>
<link rel="stylesheet" href="{{ asset('/css/test.css') }}">
```