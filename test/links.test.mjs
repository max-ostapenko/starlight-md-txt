import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteLinks } from '../dist/links.js';

const site = 'https://example.com';
const docs = new Set(['docs/guides/setup', 'docs/reference/pages']);

// Same rules the route applies: docs pages -> .md, other root-relative -> absolute
const mapLink = (url) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('#')) return undefined;
  const resolved = new URL(url, `${site}/docs/guides/current/`);
  const id = resolved.pathname.replace(/^\/+|\/+$/g, '');
  if (docs.has(id)) return `${site}/${id}.md${resolved.hash}`;
  return resolved.href === url ? undefined : resolved.href;
};

test('links to docs pages point to their Markdown file and keep the hash', () => {
  assert.equal(
    rewriteLinks('See [pages](/docs/reference/pages/#columns).', { mapLink }),
    'See [pages](https://example.com/docs/reference/pages.md#columns).',
  );
});

test('other root-relative and page-relative links become absolute', () => {
  assert.equal(
    rewriteLinks('[Reports](/reports/techreport) and [setup](../setup/)', { mapLink }),
    '[Reports](https://example.com/reports/techreport) and [setup](https://example.com/docs/guides/setup.md)',
  );
});

test('absolute URLs, mailto and anchors are untouched', () => {
  const markdown = '[a](https://other.org/x) [b](mailto:me@example.com) [c](#section)';
  assert.equal(rewriteLinks(markdown, { mapLink }), markdown);
});

test('link text equal to the URL is not rewritten, only the destination', () => {
  assert.equal(
    rewriteLinks('[/docs/reference/pages/](/docs/reference/pages/)', { mapLink }),
    '[/docs/reference/pages/](https://example.com/docs/reference/pages.md)',
  );
});

test('reference-style definitions are rewritten', () => {
  assert.equal(
    rewriteLinks('Read [the setup][s].\n\n[s]: /docs/guides/setup/', { mapLink }),
    'Read [the setup][s].\n\n[s]: https://example.com/docs/guides/setup.md',
  );
});

test('local images are paired with rendered images by position', () => {
  const images = [
    { src: `${site}/_astro/one.A1.webp`, alt: 'One' },
    { src: `${site}/_astro/two.B2.png`, alt: 'Two' },
  ];
  assert.equal(
    rewriteLinks('![One](./one.webp)\n\n![Two](../img/two.png)', { mapLink, images }),
    `![One](${site}/_astro/one.A1.webp)\n\n![Two](${site}/_astro/two.B2.png)`,
  );
});

test('local images fall back to alt-text matching when positions disagree', () => {
  const images = [
    { src: `${site}/_astro/logo.C3.svg`, alt: 'Logo from a component' },
    { src: `${site}/_astro/two.B2.png`, alt: 'Two' },
  ];
  assert.equal(
    rewriteLinks('![Two](./two.png) ![Missing](./missing.png)', { mapLink, images }),
    `![Two](${site}/_astro/two.B2.png) ![Missing](./missing.png)`,
  );
});

test('local images match by alt text when counts differ', () => {
  const images = [{ src: `${site}/_astro/two.B2.png`, alt: 'Two' }];
  assert.equal(
    rewriteLinks('![One](./one.png) ![Two](./two.png)', { mapLink, images }),
    `![One](./one.png) ![Two](${site}/_astro/two.B2.png)`,
  );
});

test('links inside raw HTML blocks are rewritten', () => {
  const markdown = [
    '<div>Field</div> | Description',
    '---|---',
    '`privacy` | See [privacy](/docs/reference/pages/) or <a href="/reports/x">reports</a>',
  ].join('\n');
  assert.equal(
    rewriteLinks(markdown, { mapLink }),
    markdown
      .replace('(/docs/reference/pages/)', '(https://example.com/docs/reference/pages.md)')
      .replace('href="/reports/x"', 'href="https://example.com/reports/x"'),
  );
});

test('everything else stays byte-for-byte identical', () => {
  const markdown = [
    'Table | Clustered by',
    '--- | ---',
    '`pages` | 1.`client`<br>2.`rank`',
    '',
    ':::danger',
    'Scans *terabytes* \\_escaped\\_ — see [costs](/docs/guides/setup/).',
    ':::',
    '',
    '```sql',
    'SELECT [x](/not/a/link) FROM t',
    '```',
  ].join('\n');
  const expected = markdown.replace('(/docs/guides/setup/)', '(https://example.com/docs/guides/setup.md)');
  assert.equal(rewriteLinks(markdown, { mapLink }), expected);
});
