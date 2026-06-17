import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightMdTxt from 'starlight-md-txt';

export default defineConfig({
  site: 'https://maxostapenko.github.io',
  base: '/starlight-md-txt',
  integrations: [
    starlight({
      title: 'starlight-md-txt',
      description: 'Starlight plugin to expose documentation pages as raw, agent-friendly Markdown at .md.txt URLs',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/maxostapenko/starlight-md-txt' },
      ],
      plugins: [
        starlightMdTxt(),
      ],
      sidebar: [
        'getting-started',
        'configuration',
      ],
    }),
  ],
});
