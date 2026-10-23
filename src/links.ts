import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export interface RenderedImage {
  /** Final image URL to write into the Markdown. */
  src: string;
  /** The image's alt text, used to pair images when counts differ. */
  alt: string;
}

export interface RewriteLinksOptions {
  /** Returns the replacement for a link or root-relative image URL, or `undefined` to keep it. */
  mapLink: (url: string) => string | undefined;
  /** Images from the rendered page in document order, to replace local (relative) image sources. */
  images?: RenderedImage[];
}

interface Edit {
  start: number;
  end: number;
  value: string;
}

const hasScheme = (url: string) => /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');

/** A relative image source that Astro processes into a hashed `/_astro/` asset. */
export const isLocalImage = (url: string) => !hasScheme(url) && !url.startsWith('/') && !url.startsWith('#');

/**
 * Rewrite link, image and definition URLs in a Markdown string.
 *
 * URLs are spliced in place using the parsed nodes' source offsets, so the rest
 * of the document stays byte-for-byte identical (tables with `<br>`, `:::` asides,
 * escapes). A URL that can't be located in its node's source is left unchanged.
 */
export function rewriteLinks(markdown: string, { mapLink, images = [] }: RewriteLinksOptions): string {
  const tree = unified().use(remarkParse).parse(markdown);
  const edits: Edit[] = [];
  const localImages: any[] = [];

  const addEdit = (node: any, url: string, value: string, searchFrom: number) => {
    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (start === undefined || end === undefined || value === url) return;
    const index = markdown.slice(start, end).indexOf(url, searchFrom);
    if (index === -1) return;
    edits.push({ start: start + index, end: start + index + url.length, value });
  };

  visit(tree, (node: any) => {
    // Raw HTML (e.g. a table whose header starts with <div>) isn't parsed as Markdown,
    // so rewrite its href/src attributes and any Markdown links it contains directly.
    if (node.type === 'html') {
      rewriteHtml(node, markdown, mapLink, edits);
      return;
    }
    if (node.type === 'image' && isLocalImage(node.url)) {
      localImages.push(node);
      return;
    }
    if (node.type !== 'link' && node.type !== 'image' && node.type !== 'definition') return;
    const value = mapLink(node.url);
    if (value === undefined) return;
    addEdit(node, node.url, value, urlSearchFrom(node, markdown));
  });

  // Pair local images with rendered ones by position when the counts match and the alt
  // text agrees (or is missing on either side); otherwise by alt text.
  const used = new Set<number>();
  const sameCount = localImages.length === images.length;
  localImages.forEach((node, i) => {
    const alt = node.alt ?? '';
    const atPosition = images[i];
    let match =
      sameCount && atPosition && !used.has(i) && (!alt || !atPosition.alt || atPosition.alt === alt) ? i : -1;
    if (match === -1) {
      match = images.findIndex((image, j) => !used.has(j) && image.alt === alt);
    }
    if (match === -1 || !images[match]) return;
    used.add(match);
    addEdit(node, node.url, images[match].src, urlSearchFrom(node, markdown));
  });

  return edits
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.value + text.slice(edit.end), markdown);
}

const HTML_URL_PATTERNS = [/\s(?:href|src)="([^"]+)"/g, /\]\(([^)\s]+)\)/g];

function rewriteHtml(node: any, markdown: string, mapLink: RewriteLinksOptions['mapLink'], edits: Edit[]) {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (start === undefined || end === undefined) return;
  const source = markdown.slice(start, end);
  for (const pattern of HTML_URL_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const url = match[1];
      const value = mapLink(url);
      if (value === undefined || value === url) continue;
      const offset = start + match.index! + match[0].indexOf(url);
      edits.push({ start: offset, end: offset + url.length, value });
    }
  }
}

/** Offset within the node's source where the URL starts, skipping link text so text that equals the URL isn't matched. */
function urlSearchFrom(node: any, markdown: string): number {
  const start = node.position.start.offset;
  if (node.type === 'link' && node.children?.length) {
    return node.children[node.children.length - 1].position.end.offset - start;
  }
  const source = markdown.slice(start, node.position.end.offset);
  const marker = node.type === 'definition' ? ']:' : '](';
  const index = source.indexOf(marker);
  return index === -1 ? 0 : index;
}
