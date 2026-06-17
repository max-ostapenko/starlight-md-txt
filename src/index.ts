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
}

export default function starlightMdTxt(opts: StarlightMdTxtOptions = {}): any {
  return {
    name: 'starlight-md-txt',
    hooks: {
      setup({ addIntegration }: any) {
        addIntegration({
          name: 'starlight-md-txt-integration',
          hooks: {
            'astro:config:setup'({ injectRoute, updateConfig }: any) {
              const format = opts.format ?? '.md';
              const cleanFormat = format.startsWith('.') ? format : `.${format}`;

              // Inject the custom dynamic route matching [...slug] + format
              injectRoute({
                entrypoint: fileURLToPath(new URL('./route.js', import.meta.url)),
                pattern: `/[...slug]${cleanFormat}`,
                prerender: true,
              });

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
