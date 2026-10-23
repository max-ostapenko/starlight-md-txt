# starlight-md-txt

## 0.1.1

### Patch Changes

- [#10](https://github.com/max-ostapenko/starlight-md-txt/pull/10) [`a82dd19`](https://github.com/max-ostapenko/starlight-md-txt/commit/a82dd19e4a6412a8867a8efd6828a788cce6a285) Thanks [@max-ostapenko](https://github.com/max-ostapenko)! - Fix builds failing on plain `.md` pages that contain HTML which isn't valid MDX (for example `<br>` in a table). The MDX transform now runs only on `.mdx` entries, and a page whose MDX can't be parsed falls back to its raw body with a warning instead of failing the build.

## 0.1.0

### Minor Changes

- [`feddf86`](https://github.com/max-ostapenko/starlight-md-txt/commit/feddf86feea1e8fbe2857b6cac1e64f49bc9b553) Thanks [@max-ostapenko](https://github.com/max-ostapenko)! - Add support for custom file format extensions (`.md` by default, `.md.txt` optionally), dynamic response headers (`text/markdown` or `text/plain`), and automatic raw Markdown fallback 404 page generation.
