# starlight-md-txt

## 0.2.0

### Minor Changes

- [#13](https://github.com/max-ostapenko/starlight-md-txt/pull/13) [`ec16691`](https://github.com/max-ostapenko/starlight-md-txt/commit/ec16691cb5753cfd848cf850f35aa83ab5802207) Thanks [@max-ostapenko](https://github.com/max-ostapenko)! - - Add an `alternateLink` option (default `false`) that advertises each page's Markdown version with `<link rel="alternate" type="text/markdown">` in its `<head>` (Starlight 0.32+).
  - Add a `dynamicRouting` option (default `true`) to turn off generating the Markdown files.
  - Add an `absoluteLinks` option (default `false`): links to other docs pages point to their Markdown files, other root-relative links and local images become absolute URLs (needs Astro's `site`).
  - Add a `notFoundPage` option (default `false`). **Behavior change:** `404.md` is no longer generated unless `notFoundPage: true`.
  - Serve the root index page at `/index.md` instead of a bare `/.md` file, following the llms.txt convention.
  - GFM tables in MDX pages now round-trip as tables instead of being escaped as text.

## 0.1.1

### Patch Changes

- [#10](https://github.com/max-ostapenko/starlight-md-txt/pull/10) [`a82dd19`](https://github.com/max-ostapenko/starlight-md-txt/commit/a82dd19e4a6412a8867a8efd6828a788cce6a285) Thanks [@max-ostapenko](https://github.com/max-ostapenko)! - Fix builds failing on plain `.md` pages that contain HTML which isn't valid MDX (for example `<br>` in a table). The MDX transform now runs only on `.mdx` entries, and a page whose MDX can't be parsed falls back to its raw body with a warning instead of failing the build.

## 0.1.0

### Minor Changes

- [`feddf86`](https://github.com/max-ostapenko/starlight-md-txt/commit/feddf86feea1e8fbe2857b6cac1e64f49bc9b553) Thanks [@max-ostapenko](https://github.com/max-ostapenko)! - Add support for custom file format extensions (`.md` by default, `.md.txt` optionally), dynamic response headers (`text/markdown` or `text/plain`), and automatic raw Markdown fallback 404 page generation.
