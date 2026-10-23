/** Route slug for an entry's Markdown file. The root index page becomes `index`. */
export function markdownSlug(id: string): string {
  return id === '' || id === 'index' ? 'index' : id;
}

/** Site-relative URL of an entry's Markdown file, e.g. `/docs/intro.md`. */
export function markdownPath(id: string, format: string, base = '/'): string {
  return `${base.replace(/\/$/, '')}/${markdownSlug(id)}${format}`;
}
