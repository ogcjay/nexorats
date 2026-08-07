import { defineConfig } from 'vitepress';

/**
 * Docs are built statically and deployed to GitHub Pages.
 * Change `base` if your repo name is not `nexora`:
 *   user.github.io/nexorajs  →  base: '/nexorajs/'
 *   custom domain / org root →  base: '/'
 */
const base = process.env.DOCS_BASE ?? '/nexorajs/';

export default defineConfig({
  title: 'Nexora',
  description:
    'Open-source TypeScript framework for Discord bots — CLI, commands, plugins, dashboard, and auth',
  base,
  cleanUrls: true,
  lastUpdated: false,
  ignoreDeadLinks: true,
  srcExclude: ['**/README.md', '**/HOSTING.md', '**/SUMMARY.md'],

  head: [['link', { rel: 'icon', href: `${base}favicon.svg` }]],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Nexora' },
    siteTitle: 'Nexora',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Packages', link: '/packages/core' },
      { text: 'Plugins', link: '/guide/plugins' },
      {
        text: 'v0.1',
        items: [{ text: 'Changelog', link: '/changelog' }],
      },
      {
        text: 'GitHub',
        link: 'https://github.com/ogcjay/nexorajs',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick start', link: '/guide/quick-start' },
            { text: 'Project structure', link: '/guide/project-structure' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Core concepts',
          items: [
            { text: 'Commands', link: '/guide/commands' },
            { text: 'Builders', link: '/guide/builders' },
            { text: 'Components V2', link: '/guide/components-v2' },
            { text: 'Events', link: '/guide/events' },
            { text: 'Classes', link: '/guide/classes' },
            { text: 'Dependency injection', link: '/guide/dependency-injection' },
            { text: 'Logging', link: '/guide/logging' },
            { text: 'Cache & scheduler', link: '/guide/cache-scheduler' },
          ],
        },
        {
          text: 'Platform',
          items: [
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'Nexora Studio', link: '/guide/studio' },
            { text: 'Database', link: '/guide/database' },
            { text: 'Auth', link: '/guide/auth' },
            { text: 'API', link: '/guide/api' },
            { text: 'Dashboard', link: '/guide/dashboard' },
            { text: 'WebSocket', link: '/guide/websocket' },
          ],
        },
        {
          text: 'Community',
          items: [
            { text: 'Contributing', link: '/guide/contributing' },
            { text: 'Plugin ecosystem', link: '/guide/ecosystem' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: '@nexorajs/core', link: '/packages/core' },
            { text: '@nexorajs/config', link: '/packages/config' },
            { text: '@nexorajs/logger', link: '/packages/logger' },
            { text: '@nexorajs/database', link: '/packages/database' },
            { text: '@nexorajs/auth', link: '/packages/auth' },
            { text: '@nexorajs/api', link: '/packages/api' },
            { text: '@nexorajs/plugin-system', link: '/packages/plugin-system' },
            { text: '@nexorajs/websocket', link: '/packages/websocket' },
            { text: '@nexorajs/ui', link: '/packages/ui' },
            { text: 'create-nexorajs', link: '/packages/cli' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/ogcjay/nexorajs' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/ogcjay/nexorajs/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Nexora Contributors',
    },
  },
});
