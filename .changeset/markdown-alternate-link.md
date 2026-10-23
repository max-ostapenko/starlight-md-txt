---
"starlight-md-txt": minor
---

- Add an `alternateLink` option (default `false`) that advertises each page's Markdown version with `<link rel="alternate" type="text/markdown">` in its `<head>` (Starlight 0.32+).
- Add a `dynamicRouting` option (default `true`) to turn off generating the Markdown files.
- Add an `absoluteLinks` option (default `false`): links to other docs pages point to their Markdown files, other root-relative links and local images become absolute URLs (needs Astro's `site`).
- Add a `notFoundPage` option (default `false`). **Behavior change:** `404.md` is no longer generated unless `notFoundPage: true`.
- Serve the root index page at `/index.md` instead of a bare `/.md` file, following the llms.txt convention.
- GFM tables in MDX pages now round-trip as tables instead of being escaped as text.
