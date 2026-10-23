import { getCollection, render } from 'astro:content';
import type { APIRoute } from 'astro';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { gfmTable } from 'micromark-extension-gfm-table';
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import { markdownPath, markdownSlug } from './paths.js';
import { rewriteLinks, type RenderedImage } from './links.js';
// @ts-ignore
import { config } from 'virtual:starlight-md-txt/config';

// Helper to serialize metadata to YAML format
function toYAML(val: any, indent = 0): string {
  const spacing = ' '.repeat(indent);
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val !== 'object') {
    if (typeof val === 'string') {
      if (val.includes(':') || val.includes('\n') || val.includes('"') || val.includes("'")) {
        return JSON.stringify(val);
      }
      return val;
    }
    return String(val);
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    return val.map(item => `\n${spacing}- ${toYAML(item, indent + 2).trim()}`).join('');
  }
  return Object.entries(val)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `\n${spacing}${k}: ${toYAML(v, indent + 2).trim()}`)
    .join('');
}

// GFM tables only (not the full remark-gfm preset), so tables round-trip instead of being
// escaped as text, without strikethrough escaping "~" or bare URLs turning into [url](url).
function remarkGfmTables(this: any) {
  const data = this.data();
  (data.micromarkExtensions ??= []).push(gfmTable());
  (data.fromMarkdownExtensions ??= []).push(gfmTableFromMarkdown());
  (data.toMarkdownExtensions ??= []).push(gfmTableToMarkdown({ tablePipeAlign: false }));
}

// Function to clean Astro/MDX components using a proper AST-based Remark parser/transformer
async function cleanMDX(body: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfmTables)
    .use(() => (tree: any) => {
      // 1. Remove ES module import/export nodes (mdxjsEsm)
      tree.children = tree.children.filter((node: any) => node.type !== 'mdxjsEsm');

      // 2. Transform JSX elements and expressions
      visit(tree, (node: any, index: number | undefined, parent: any) => {
        if (index === undefined || !parent) return;

        // Strip JSX comments ({/* comment */})
        if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
          if (node.value && node.value.trim().startsWith('/*') && node.value.trim().endsWith('*/')) {
            parent.children.splice(index, 1);
            return index;
          }
        }

        if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
          const name = node.name;
          const attrs: Record<string, any> = {};
          if (node.attributes) {
            for (const attr of node.attributes) {
              if (attr.type === 'mdxJsxAttribute') {
                attrs[attr.name] = attr.value;
              }
            }
          }

          if (name === 'Tabs' || name === 'CardGrid') {
            // Replace with its children directly
            parent.children.splice(index, 1, ...node.children);
            return index; // Re-evaluate from the same index
          }

          if (name === 'TabItem') {
            const label = attrs.label || 'Option';
            // Convert TabItem to a bold label followed by its children
            const titleNode = {
              type: 'paragraph',
              children: [{ type: 'strong', children: [{ type: 'text', value: label + ':' }] }]
            };
            parent.children.splice(index, 1, titleNode, ...node.children);
            return index;
          }

          if (name === 'Aside') {
            const type = (attrs.type || 'note').toUpperCase();
            // Wrap all children of Aside in blockquote nodes
            const blockquoteChildren = [
              {
                type: 'paragraph',
                children: [{ type: 'strong', children: [{ type: 'text', value: type + ':' }] }]
              },
              ...node.children
            ];
            const blockquoteNode = {
              type: 'blockquote',
              children: blockquoteChildren
            };
            parent.children.splice(index, 1, blockquoteNode);
            return index;
          }

          if (name === 'Card' || name === 'LinkCard') {
            const title = attrs.title || 'Card';
            const headingNode = {
              type: 'heading',
              depth: 3,
              children: [{ type: 'text', value: title }]
            };
            parent.children.splice(index, 1, headingNode, ...node.children);
            return index;
          }

          // For any other capitalized custom component (e.g. Steps), just replace with its children
          if (name && name[0] === name[0].toUpperCase()) {
            parent.children.splice(index, 1, ...node.children);
            return index;
          }
        }
      });
    })
    .use(remarkStringify);

  const result = await processor.process(body);
  return result.toString();
}

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  const isDev = import.meta.env.DEV;
  
  // Follow the 'draft' attribute configuration
  const publicDocs = docs.filter((entry: any) => 
    isDev || config.includeDrafts || entry.data.draft !== true
  );

  // 404.md is opt-in: on static hosts its 404 status is lost and it is served with 200
  const pageDocs = config.notFoundPage
    ? publicDocs
    : publicDocs.filter((entry: any) => entry.id !== '404');

  const paths = pageDocs.map((entry: any) => {
    // The root index page has an empty id; serve it as /index.md rather than a bare /.md file
    const slug = markdownSlug(entry.id);
    return {
      params: { slug },
      props: { entry },
    };
  });

  // If there is no custom 404 entry in the collection, add a fallback 404 route
  const hasCustom404 = pageDocs.some((entry: any) => entry.id === '404');
  if (config.notFoundPage && !hasCustom404) {
    paths.push({
      params: { slug: '404' },
      props: {
        entry: {
          id: '404',
          body: 'Page not found',
          data: {
            title: 'Page not found',
          },
        },
      },
    });
  }

  return paths;
}

export const GET: APIRoute = async (context: any) => {
  const { entry } = context.props;

  // Keep only 'title' and 'description' in the frontmatter
  const frontmatterData: Record<string, any> = {};
  if (entry.data.title) {
    frontmatterData.title = entry.data.title;
  }
  if (entry.data.description) {
    frontmatterData.description = entry.data.description;
  }

  const yamlFrontmatter = toYAML(frontmatterData).trim();
  // Plain .md pages may contain HTML that isn't valid MDX (e.g. <br>), so only
  // run the MDX transform on .mdx entries, and fall back to the raw body if it fails.
  const body = entry.body || '';
  const isMdx = (entry.filePath ?? '').endsWith('.mdx');
  let cleanedBody: string;
  try {
    cleanedBody = isMdx ? await cleanMDX(body) : body;
  } catch (err: any) {
    console.warn(`[starlight-md-txt] ${entry.id}: ${err?.message ?? err}; serving raw body`);
    cleanedBody = body;
  }
  if (config.absoluteLinks && entry.id !== '404') {
    try {
      cleanedBody = await absolutizeLinks(entry, cleanedBody, context);
    } catch (err: any) {
      console.warn(`[starlight-md-txt] ${entry.id}: could not rewrite links (${err?.message ?? err})`);
    }
  }
  const rawMarkdown = `---\n${yamlFrontmatter}\n---\n\n${cleanedBody.trim()}`;

  const format = config.format ?? '.md';
  const contentType = format === '.md.txt'
    ? 'text/plain; charset=utf-8'
    : 'text/markdown; charset=utf-8';

  const is404 = entry.id === '404';

  return new Response(rawMarkdown, {
    status: is404 ? 404 : 200,
    headers: {
      'Content-Type': contentType,
    },
  });
};

// --- absoluteLinks -----------------------------------------------------------

const PLACEHOLDER_ORIGIN = 'https://starlight-md-txt.invalid';
let docIdsPromise: Promise<Set<string>> | undefined;
let containerPromise: Promise<any> | undefined;
let warnedNoSite = false;

/** Ids of every docs page, to recognise links that should point to a Markdown file. */
function getDocIds(): Promise<Set<string>> {
  if (!docIdsPromise) {
    docIdsPromise = getCollection('docs').then((docs: any[]) => new Set(docs.map((doc) => doc.id)));
  }
  return docIdsPromise!;
}

/** Astro container with the MDX renderer, created on first use so default builds don't load it. */
function getContainer(): Promise<any> {
  if (!containerPromise) containerPromise = (async () => {
    const { experimental_AstroContainer } = await import('astro/container');
    const { default: mdxServer } = await import('@astrojs/mdx/server.js');
    return experimental_AstroContainer.create({ renderers: [{ name: 'astro:jsx', ssr: mdxServer }] });
  })();
  return containerPromise;
}

const decodeEntities = (text: string) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** `<img>` sources and alt text from the rendered page, in document order, skipping remote images. */
async function renderedImages(entry: any, context: any): Promise<Array<{ src: string; alt: string }>> {
  const { Content } = await render(entry);
  const container = await getContainer();
  const html: string = await container.renderToString(Content, context);
  return [...html.matchAll(/<img\b[^>]*>/gi)]
    .map(([tag]) => ({
      src: decodeEntities(tag.match(/\ssrc="([^"]*)"/i)?.[1] ?? ''),
      alt: decodeEntities(tag.match(/\salt="([^"]*)"/i)?.[1] ?? ''),
    }))
    .filter((image) => image.src && !/^[a-z][a-z0-9+.-]*:/i.test(image.src) && !image.src.startsWith('//'));
}

/**
 * Point links to other docs pages at their Markdown files, make other root-relative
 * links and local images absolute. Without Astro's `site`, URLs stay root-relative.
 */
async function absolutizeLinks(entry: any, markdown: string, context: any): Promise<string> {
  const site: URL | undefined = context.site;
  if (!site && !warnedNoSite) {
    warnedNoSite = true;
    console.warn('[starlight-md-txt] `absoluteLinks` needs Astro\'s `site` option for absolute URLs; links stay root-relative.');
  }

  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const ids = await getDocIds();
  // Starlight serves pages as directories, so relative links resolve against `/base/id/`
  const pageUrl = new URL(`${base}/${entry.id ? `${entry.id}/` : ''}`, PLACEHOLDER_ORIGIN);
  const toOutput = (path: string) => (site ? new URL(path, site).href : path);

  const mapLink = (url: string): string | undefined => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#')) return undefined;
    const resolved = new URL(url, pageUrl);
    if (resolved.origin !== PLACEHOLDER_ORIGIN) return undefined;

    const path = resolved.pathname.startsWith(`${base}/`) || resolved.pathname === base
      ? resolved.pathname.slice(base.length)
      : resolved.pathname;
    const id = decodeURIComponent(path).replace(/^\/+|\/+$/g, '');
    const docId = ids.has(id) ? id : id === '' && ids.has('index') ? 'index' : undefined;

    if (docId !== undefined) return toOutput(`${markdownPath(docId, config.format, import.meta.env.BASE_URL)}${resolved.hash}`);
    const output = toOutput(`${resolved.pathname}${resolved.search}${resolved.hash}`);
    return output === url ? undefined : output;
  };

  // Rendered <img> sources are already root-relative /_astro/ paths; only the origin is missing
  const images: RenderedImage[] = (await renderedImages(entry, context)).map((image) => ({
    src: toOutput(image.src),
    alt: image.alt,
  }));

  return rewriteLinks(markdown, { mapLink, images });
}
