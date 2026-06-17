# starlight-md-txt

A community Starlight plugin to expose your documentation pages as raw, agent-friendly Markdown at `.md.txt` URLs (e.g. `/get-started/quickstart.md.txt`).

This is designed to help AI agents, LLMs, and search crawlers easily consume your documentation in a structured, clean format without navigation headers, footers, script code, or CSS wrappers.

## Features
- **Dynamic Routing:** Automatically registers routes matching `/[...slug].md.txt` for all pages in your Starlight collection.
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
        }),
      ],
    }),
  ],
});
```

Now, when you run your build, all of your documentation pages will have a corresponding `.md.txt` file (e.g., `dist/get-started/quickstart.md.txt`) alongside the standard HTML pages.

## License

MIT License.
