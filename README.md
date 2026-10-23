# starlight-md-txt

A community Starlight plugin to expose your documentation pages as raw, agent-friendly Markdown at `.md` URLs (e.g. `/get-started/quickstart.md`), following the [llms.txt](https://llmstxt.org/) convention of serving a page's Markdown at its URL with `.md` appended. Set `format: '.md.txt'` to serve `text/plain` files instead.

This is designed to help AI agents, LLMs, and search crawlers easily consume your documentation in a structured, clean format without navigation headers, footers, script code, or CSS wrappers.

## Features
- **Dynamic Routing (on by default):** Automatically registers routes matching `/[...slug].md` (or `.md.txt`) for all pages in your Starlight collection. The root index page is served at `/index.md`.
- **Discoverable (opt-in):** With `alternateLink: true`, adds `<link rel="alternate" type="text/markdown" href="…">` to each page's `<head>`, so agents and crawlers that land on the HTML page can find its Markdown version (Starlight 0.32+).
- **AST-based MDX Transpilation:** Rather than basic regex/bruteforce string replacement, it uses a proper AST-based Remark parser (`unified`, `remark-parse`, `remark-mdx`) to translate custom Starlight/JSX components into clean, native Markdown elements:
  - `<Tabs>` and `<TabItem>` components are converted into clean, bold headers.
  - `<Aside>` elements are translated into blockquotes.
  - `<Card>` and `<LinkCard>` blocks are transformed to standard headers.
  - MDX imports and JSX/MDX comments are completely removed.
- **Selective Frontmatter:** Retains only `title` and `description` in the generated YAML frontmatter block for agent efficiency.
- **Draft Handling:** Respects the `draft` frontmatter attribute by hiding draft pages in production builds (mirroring Starlight's default behavior), unless `includeDrafts` is configured to `true`.

## Installation

Install the plugin using your package manager:

```bash
npm install starlight-md-txt
```

## Usage

Add the plugin to your `astro.config.mjs` within the `starlight` integrations configuration:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightMdTxt from 'starlight-md-txt';

export default defineConfig({
  site: 'https://your-site.com',
  integrations: [
    starlight({
      title: 'My Documentation',
      plugins: [
        starlightMdTxt({
          // Optional: include draft pages in production builds
          includeDrafts: false,
          // Optional: '.md' (default, text/markdown) or '.md.txt' (text/plain)
          format: '.md',
          // Optional: add <link rel="alternate"> to each page's <head>
          alternateLink: false,
          // Optional: set to false to stop generating the Markdown files
          dynamicRouting: true,
        }),
      ],
    }),
  ],
});
```

Now, when you run your build, all of your documentation pages will have a corresponding `.md` file (e.g., `dist/get-started/quickstart.md`) alongside the standard HTML pages.

## License

MIT License.
