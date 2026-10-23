declare module 'astro:content' {
  export const getCollection: any;
  export const getEntry: any;
  export const render: any;
}

declare module '@astrojs/mdx/server.js' {
  const renderer: any;
  export default renderer;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:starlight-md-txt/config' {
  export const config: {
    includeDrafts: boolean;
    format: '.md' | '.md.txt';
    notFoundPage: boolean;
    absoluteLinks: boolean;
  };
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
}
