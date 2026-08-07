import { defineConfig } from 'vitepress';

/**
 * Docs are built statically and deployed to GitHub Pages.
 * Change `base` if your repo name is not `nexora`:
 *   user.github.io/nexorajs  →  base: '/nexora.ts/'
 *   custom domain / org root →  base: '/'
 */
const base = process.env.DOCS_BASE ?? '/nexora.ts/';

/** Shared sidebar — discord.js-style: top categories + nested collapsible groups */
const sidebar = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Introduction', link: '/guide/introduction' },
      { text: 'Quick start', link: '/guide/quick-start' },
      { text: 'Project structure', link: '/guide/project-structure' },
      { text: 'Configuration', link: '/guide/configuration' },
    ],
  },
  {
    text: 'Nexora Studio',
    collapsed: false,
    items: [{ text: 'Developer Center', link: '/guide/studio' }],
  },
  {
    text: 'Commands & Interactions',
    collapsed: false,
    items: [
      { text: 'Commands', link: '/guide/commands' },
      { text: 'Events', link: '/guide/events' },
    ],
  },
  {
    text: 'Builders & UI',
    collapsed: false,
    items: [
      { text: 'Builders', link: '/guide/builders' },
      { text: 'Components V2', link: '/guide/components-v2' },
    ],
  },
  {
    text: 'Classes',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/classes/' },
      {
        text: 'Framework',
        collapsed: false,
        items: [
          { text: 'Nexora', link: '/classes/nexora' },
          { text: 'SlashCommand', link: '/classes/slash-command' },
          { text: 'SlashCommandGroup', link: '/classes/slash-command-group' },
          { text: 'EventHandler', link: '/classes/event-handler' },
          { text: 'ButtonHandler', link: '/classes/button-handler' },
          { text: 'Service', link: '/classes/service' },
          { text: 'NexoraPlugin', link: '/classes/nexora-plugin' },
          { text: 'Logger', link: '/classes/logger' },
        ],
      },
      {
        text: 'Message UI',
        collapsed: false,
        items: [
          { text: 'EmbedBuilder', link: '/classes/embed-builder' },
          { text: 'ButtonBuilder', link: '/classes/button-builder' },
          { text: 'ModalBuilder', link: '/classes/modal-builder' },
          { text: 'LayoutContainerBuilder', link: '/classes/layout-container' },
          { text: 'Paginator', link: '/classes/paginator' },
        ],
      },
    ],
  },
  {
    text: 'Advanced',
    collapsed: false,
    items: [
      { text: 'Dependency injection', link: '/guide/dependency-injection' },
      { text: 'Logging', link: '/guide/logging' },
      { text: 'Cache & scheduler', link: '/guide/cache-scheduler' },
      { text: 'Plugins', link: '/guide/plugins' },
    ],
  },
  {
    text: 'Platform',
    collapsed: false,
    items: [
      { text: 'Database', link: '/guide/database' },
      { text: 'Auth', link: '/guide/auth' },
      { text: 'API', link: '/guide/api' },
      { text: 'WebSocket', link: '/guide/websocket' },
    ],
  },
  {
    text: 'Packages',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/packages/' },
      { text: '@nexora.ts/core', link: '/packages/core' },
      { text: '@nexora.ts/config', link: '/packages/config' },
      { text: '@nexora.ts/logger', link: '/packages/logger' },
      { text: '@nexora.ts/database', link: '/packages/database' },
      { text: '@nexora.ts/auth', link: '/packages/auth' },
      { text: '@nexora.ts/api', link: '/packages/api' },
      { text: '@nexora.ts/plugin-system', link: '/packages/plugin-system' },
      { text: '@nexora.ts/websocket', link: '/packages/websocket' },
      { text: 'create-nexora-ts', link: '/packages/cli' },
    ],
  },
  {
    text: 'Community',
    collapsed: true,
    items: [
      { text: 'Contributing', link: '/guide/contributing' },
      { text: 'Plugin ecosystem', link: '/guide/ecosystem' },
      { text: 'Changelog', link: '/changelog' },
    ],
  },
];

export default defineConfig({
  title: 'Nexora',
  description:
    'Open-source TypeScript application framework for Discord bots — CLI, Studio, plugins, and auto-discovery on top of Discord.js',
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
      { text: 'Studio', link: '/guide/studio' },
      { text: 'Classes', link: '/classes/' },
      { text: 'Packages', link: '/packages/' },
      {
        text: 'v0.1',
        items: [{ text: 'Changelog', link: '/changelog' }],
      },
      {
        text: 'GitHub',
        link: 'https://github.com/ogcjay/nexorajs',
      },
    ],

    sidebar,

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
