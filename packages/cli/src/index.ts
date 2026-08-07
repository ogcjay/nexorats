#!/usr/bin/env node

import prompts from 'prompts';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

interface ProjectOptions {
  name: string;
  database: 'postgresql' | 'sqlite';
  dashboard: boolean;
  docker: boolean;
  linting: boolean;
  githubActions: boolean;
  example: boolean;
}

async function main(): Promise<void> {
  const targetDir = process.argv[2];

  console.log('\n  🚀 Create Nexora Project\n');

  const answers = await prompts([
    {
      type: targetDir ? null : 'text',
      name: 'name',
      message: 'Project name',
      initial: 'my-nexora-bot',
      validate: (v: string) =>
        /^[a-z0-9-]+$/.test(v) ? true : 'Use lowercase letters, numbers, and hyphens',
    },
    {
      type: 'select',
      name: 'database',
      message: 'Database',
      choices: [
        { title: 'PostgreSQL (recommended)', value: 'postgresql' },
        { title: 'SQLite (development)', value: 'sqlite' },
      ],
    },
    {
      type: 'confirm',
      name: 'dashboard',
      message: 'Include experimental dashboard config? (unreleased — coming soon)',
      initial: false,
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'Include Docker setup?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'linting',
      message: 'Include ESLint + Prettier?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'githubActions',
      message: 'Include GitHub Actions CI?',
      initial: false,
    },
    {
      type: 'confirm',
      name: 'example',
      message: 'Include example commands & events?',
      initial: true,
    },
  ]);

  const options: ProjectOptions = {
    name: targetDir ?? answers.name,
    database: answers.database ?? 'postgresql',
    dashboard: answers.dashboard ?? true,
    docker: answers.docker ?? true,
    linting: answers.linting ?? true,
    githubActions: answers.githubActions ?? false,
    example: answers.example ?? true,
  };

  const projectPath = join(process.cwd(), options.name);

  if (existsSync(projectPath)) {
    console.error(`\n  ❌ Directory "${options.name}" already exists.\n`);
    process.exit(1);
  }

  mkdirSync(projectPath, { recursive: true });
  scaffoldProject(projectPath, options);

  console.log(`\n  ✅ Created ${options.name}\n`);
  console.log('  Next steps:\n');
  console.log(`    cd ${options.name}`);
  console.log('    pnpm install');
  console.log('    # Edit .env with your Discord bot token');
  console.log('    pnpm dev');
  console.log('    # Studio (Developer Center): http://localhost:3002 (API :3920)');
  if (options.dashboard) {
    console.log(
      '    # Dashboard: experimental / unreleased — coming soon (config scaffolded only).\n',
    );
  } else {
    console.log('');
  }
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function writeFile(filePath: string, content: string): void {
  ensureDir(filePath);
  writeFileSync(filePath, content);
}

function scaffoldProject(projectPath: string, options: ProjectOptions): void {
  const dbUrl =
    options.database === 'sqlite'
      ? 'sqlite:./data/nexora.db'
      : 'postgresql://nexora:nexora@localhost:5432/nexora';

  const envContent = `DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=${dbUrl}
DASHBOARD_SECRET=change_me_to_random_string
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
`;

  writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(
      {
        name: options.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'tsx watch --env-file=.env src/index.ts',
          start: 'node --env-file=.env dist/index.js',
          build: 'tsc',
          'db:migrate': 'drizzle-kit migrate',
        },
        dependencies: {
          '@nexora.ts/config': '^0.1.2',
          '@nexora.ts/core': '^0.1.7',
          '@nexora.ts/logger': '^0.1.2',
          '@nexora.ts/dev-server': '^0.1.3',
          ...(options.dashboard
            ? {
                '@nexora.ts/database': '^0.1.1',
                '@nexora.ts/auth': '^0.1.1',
                '@nexora.ts/api': '^0.1.1',
                '@nexora.ts/websocket': '^0.1.2',
              }
            : {}),
        },
        devDependencies: {
          '@types/node': '^22.10.0',
          tsx: '^4.19.2',
          typescript: '^5.7.2',
          ...(options.linting
            ? {
                eslint: '^9.17.0',
                prettier: '^3.4.2',
              }
            : {}),
        },
      },
      null,
      2,
    ),
  );

  writeFile(
    join(projectPath, 'nexora.config.ts'),
    `import { defineConfig } from '@nexora.ts/config';

export default defineConfig({
  bot: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    provider: '${options.database}',
    url: process.env.DATABASE_URL ?? '${dbUrl}',
  },
  ${
    options.dashboard
      ? `// Experimental / unreleased — config reserved for the upcoming dashboard
  dashboard: {
    enabled: true,
    port: 3000,
    url: process.env.DASHBOARD_URL ?? 'http://localhost:3000',
    secret: process.env.DASHBOARD_SECRET,
  },
  auth: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    redirectUri: process.env.OAUTH_REDIRECT_URI ?? 'http://localhost:3000/api/auth/callback',
  },`
      : ''
  }
  logger: {
    level: 'info',
    file: { enabled: true, path: './logs/nexora.log' },
    liveStream: ${options.dashboard},
  },
});
`,
  );

  writeFile(
    join(projectPath, 'src/index.ts'),
    `import config from '../nexora.config.js';
import { Nexora } from '@nexora.ts/core';
import { createDevServer } from '@nexora.ts/dev-server';

const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
});

const studioApi = createDevServer(bot, {
  port: 3920,
  studioPort: 3002,
});

await studioApi.start();
await bot.start();

process.on('SIGINT', async () => {
  await studioApi.stop();
  await bot.stop();
  process.exit(0);
});
`,
  );

  writeFile(
    join(projectPath, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          outDir: './dist',
          rootDir: '.',
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*', 'commands/**/*', 'events/**/*', 'nexora.config.ts'],
      },
      null,
      2,
    ),
  );

  writeFile(join(projectPath, '.env.example'), envContent);
  writeFile(join(projectPath, '.env'), envContent);

  writeFile(join(projectPath, '.gitignore'), 'node_modules/\ndist/\n.env\nlogs/\ndata/\n');

  // Ensure empty plugins/ exists for local plugin discovery
  writeFile(join(projectPath, 'plugins/.gitkeep'), '');

  if (options.example) {
    writeFile(
      join(projectPath, 'commands/ping.ts'),
      `import { command } from '@nexora.ts/core';

export default command({
  name: 'ping',
  description: 'Check bot latency',
  async execute(ctx) {
    const sent = await ctx.interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - ctx.interaction.createdTimestamp;
    await ctx.interaction.editReply(\`Pong! Latency: \${latency}ms\`);
  },
});
`,
    );

    writeFile(
      join(projectPath, 'events/ready.ts'),
      `import { event } from '@nexora.ts/core';

export default event('ready', (client) => {
  console.log(\`Logged in as \${client.user.tag}\`);
  client.user.setActivity('Nexora', { type: 3 });
});
`,
    );
  }

  if (options.docker) {
    writeFile(
      join(projectPath, 'docker-compose.yml'),
      options.database === 'postgresql'
        ? `services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nexora
      POSTGRES_PASSWORD: nexora
      POSTGRES_DB: nexora
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`
        : `# SQLite — no external database service needed
`,
    );
  }

  if (options.githubActions) {
    writeFile(
      join(projectPath, '.github/workflows/ci.yml'),
      `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
