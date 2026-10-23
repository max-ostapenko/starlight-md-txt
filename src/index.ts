import { fileURLToPath } from 'url';

export interface StarlightMdTxtOptions {
  /**
   * Whether to include draft pages in production builds.
   * Defaults to false (mirrors Starlight draft behaviour).
   */
  includeDrafts?: boolean;
  /**
   * File extension format for raw markdown.
   * Defaults to '.md'.
   */
  format?: '.md' | '.md.txt';
  /**
   * Add `<link rel="alternate" type="text/markdown" href="...">` to each page's
   * `<head>` so agents and crawlers can discover its Markdown version.
   * Requires Starlight 0.32+. Defaults to false.
   */
  alternateLink?: boolean;
  /**
   * Register the `/[...slug].md` (or `.md.txt`) route that generates a Markdown
   * file for every page. Set to false to turn off Markdown output, for example
   * in one environment. Defaults to true.
   */
  dynamicRouting?: boolean;
}

export default function starlightMdTxt(opts: StarlightMdTxtOptions = {}): any {
  return {
    name: 'starlight-md-txt',
    hooks: {
      setup({ addIntegration, addRouteMiddleware, logger }: any) {
        const dynamicRouting = opts.dynamicRouting ?? true;
        if (opts.alternateLink && !dynamicRouting) {
          logger?.warn('`alternateLink` is on but `dynamicRouting` is off, so the links will point to Markdown files that are not generated.');
        }

        // Route middleware needs Starlight 0.32+; older versions just skip the <link> tag.
        if (opts.alternateLink && typeof addRouteMiddleware === 'function') {
          addRouteMiddleware({ entrypoint: fileURLToPath(new URL('./middleware.js', import.meta.url)) });
        }

        addIntegration({
          name: 'starlight-md-txt-integration',
          hooks: {
            'astro:config:setup'({ injectRoute, updateConfig }: any) {
              const format = opts.format ?? '.md';
              const cleanFormat = format.startsWith('.') ? format : `.${format}`;

              // Inject the custom dynamic route matching [...slug] + format
              if (dynamicRouting) {
                injectRoute({
                  entrypoint: fileURLToPath(new URL('./route.js', import.meta.url)),
                  pattern: `/[...slug]${cleanFormat}`,
                  prerender: true,
                });
              }

              // Create virtual module for configuration passing
              const virtualModuleId = 'virtual:starlight-md-txt/config';
              const resolvedVirtualModuleId = '\0' + virtualModuleId;

              updateConfig({
                vite: {
                  plugins: [
                    {
                      name: 'vite-plugin-starlight-md-txt',
                      resolveId(id: string) {
                        if (id === virtualModuleId) {
                          return resolvedVirtualModuleId;
                        }
                      },
                      load(id: string) {
                        if (id === resolvedVirtualModuleId) {
                          return `export const config = ${JSON.stringify({
                            includeDrafts: opts.includeDrafts ?? false,
                            format: cleanFormat,
                          })};`;
                        }
                      },
                    },
                  ],
                },
              });
            },
          },
        });
      },
    },
  };
}
