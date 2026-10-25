import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://blog.model-gate.fun',
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
