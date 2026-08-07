#!/usr/bin/env node

import prompts from 'prompts';
import { mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      message: 'Include dashboard?',
      initial: true,
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
  console.log('    cp .env.example .env');
  console.log('    # Edit .env with your Discord bot token');
  console.log('    pnpm dev\n');
}

function scaffoldProject(projectPath: string, options: ProjectOptions): void {
  const dbUrl =
    options.database === 'sqlite'
      ? 'sqlite:./data/nexora.db'
      : 'postgresql://nexora:nexora@localhost:5432/nexora';

  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify(
      {
        name: options.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'tsx watch src/index.ts',
          start: 'node dist/index.js',
          build: 'tsc',
          'db:migrate': 'drizzle-kit migrate',
        },
        dependencies: {
          '@nexorajs/config': '^0.1.0',
          '@nexorajs/core': '^0.1.0',
          '@nexorajs/logger': '^0.1.0',
          ...(options.dashboard
            ? {
                '@nexorajs/database': '^0.1.0',
                '@nexorajs/auth': '^0.1.0',
                '@nexorajs/api': '^0.1.0',
                '@nexorajs/websocket': '^0.1.0',
              }
            : {}),
        },
        devDependencies: {
          '@types/node': '^22.10.0',
          tsx: '^4.19.2',
          typescript: '^5.7.2',
        },
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(projectPath, 'nexora.config.ts'),
    `import { defineConfig } from '@nexorajs/config';

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
      ? `dashboard: {
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

  writeFileSync(
    join(projectPath, 'src/index.ts'),
    `import config from '../nexora.config.js';
import { Nexora } from '@nexorajs/core';

const bot = new Nexora({
  config,
  commandsPath: './commands/**/*.ts',
  eventsPath: './events/**/*.ts',
});

await bot.start();

process.on('SIGINT', async () => {
  await bot.stop();
  process.exit(0);
});
`,
  );

  writeFileSync(
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

  writeFileSync(
    join(projectPath, '.env.example'),
    `DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=${dbUrl}
DASHBOARD_SECRET=change_me_to_random_string
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
`,
  );

  writeFileSync(join(projectPath, '.gitignore'), 'node_modules/\ndist/\n.env\nlogs/\ndata/\n');

  if (options.example) {
    mkdirSync(join(projectPath, 'commands'), { recursive: true });
    mkdirSync(join(projectPath, 'events'), { recursive: true });

    writeFileSync(
      join(projectPath, 'commands/ping.ts'),
      `import { command } from '@nexorajs/core';

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

    writeFileSync(
      join(projectPath, 'events/ready.ts'),
      `import { event } from '@nexorajs/core';

export default event('ready', (client) => {
  console.log(\`Logged in as \${client.user.tag}\`);
  client.user.setActivity('Nexora', { type: 3 });
});
`,
    );
  }

  if (options.docker) {
    writeFileSync(
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
    mkdirSync(join(projectPath, '.github/workflows'), { recursive: true });
    writeFileSync(
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
