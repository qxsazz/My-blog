# Upstream provenance

Base: https://github.com/Innei/Yohaku
Commit: 37a055bebce83e950847c92e0cfd616c593acf4d
Subproject: design-system/showcase (React + Vite + Tailwind 4).

The complete design-system subtree, checks, source tokens, theme hook, templates, reference docs and Showcase sections are retained under their original MIT license. Original App.tsx is retained as DesignSystemApp.tsx and remains available at /design/.

The root workspace is narrowed to the public design-system; iOS and unavailable private Web packages are not required. A custom blog application, content pipeline and static prerendering replace the demo entry. There are no Astro, Fuwari, Svelte or Swup runtime dependencies in this project.
