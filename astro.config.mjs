import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://blog.model-gate.fun',
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: page => !new URL(page).pathname.startsWith('/preview/') && !new URL(page).pathname.startsWith('/thinking/') })],
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
