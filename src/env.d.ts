declare module 'astro:content' {
  export const getCollection: any;
  export const getEntry: any;
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
  };
}
