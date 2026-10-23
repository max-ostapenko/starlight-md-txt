// @ts-ignore
import { config } from 'virtual:starlight-md-txt/config';
import { markdownPath } from './paths.js';

// Advertise each page's Markdown version, so agents and crawlers that land on
// the HTML page can find it: <link rel="alternate" type="text/markdown" href="...">
// Same shape as Starlight's defineRouteMiddleware(); typed loosely so this package
// doesn't type-check Starlight's sources.
export const onRequest = (context: any) => {
  const route = context.locals.starlightRoute;
  if (route.id === '404') return;

  route.head.push({
    tag: 'link',
    attrs: {
      rel: 'alternate',
      type: config.format === '.md.txt' ? 'text/plain' : 'text/markdown',
      href: markdownPath(route.id, config.format, import.meta.env.BASE_URL),
    },
  });
};
