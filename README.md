# Rule34 Quick Edit — Project README

## For LLMs

### Docstrings
Every `.js` file **must** begin with a single-line block comment that is the file's docstring:

```js
// TITLE: description of exports, responsibilities, and key behaviour.
```

**Rules:**
- The docstring is always **line 1** — no blank lines or other comments before it.
- It must name every exported function/symbol and summarise what each does.
- When you meaningfully change a file's responsibilities or exports, update its docstring in the same edit.

### Manifest files
`docs/*.manifest` files are auto-generated summaries of each directory's docstrings.  
**Do not edit manifest files by hand.**

### Directory structure
| Path | Purpose |
|------|---------|
| `network/` | API calls, caching |
| `storage/` | GM storage keys and CRUD helpers |
| `logic/` | Rule parsing and relation engine |
| `ui/button/` | Floating button — create, theme, icons, menu, toggle |
| `ui/mirror/` | Bottom mirror panel — DOM, chips, sync, styles |
| `ui/manager/` | Full-screen relations manager — shell, tabs, pages |
| `ui/autocomplete/` | Shared autocomplete dropdown |
| `handlers/` | Page-level entry points (post view, post list) |
| `init/` | Bootstrap / entry point |
| `docs/` | Auto-generated manifests — do not edit |