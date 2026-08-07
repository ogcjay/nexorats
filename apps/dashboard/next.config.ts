import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@nexorajs/ui'],
  env: {
    NEXORA_API_URL: process.env.NEXORA_API_URL ?? 'http://localhost:4000',
    NEXORA_WS_URL: process.env.NEXORA_WS_URL ?? 'ws://localhost:4001',
  },
};

export default nextConfig;
