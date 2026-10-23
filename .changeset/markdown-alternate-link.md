---
"starlight-md-txt": minor
---

Add an `alternateLink` option (default `false`) that advertises each page's Markdown version with `<link rel="alternate" type="text/markdown">` in its `<head>` (Starlight 0.32+), so agents and crawlers that land on the HTML page can find it. Serve the root index page at `/index.md` instead of a bare `/.md` file, following the llms.txt convention.
