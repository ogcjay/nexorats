/** Minimal plugin shape for graph nodes (avoids circular import with index). */
export interface StudioGraphPlugin {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  commands: number;
  events: number;
}

export interface StudioGraphNode {
  id: string;
  label: string;
  kind: 'bot' | 'plugin' | 'package' | 'service';
  version?: string;
  meta?: Record<string, unknown>;
}

export interface StudioGraphEdge {
  from: string;
  to: string;
  kind: 'depends' | 'loads' | 'provides';
}

export interface StudioDependencyGraph {
  nodes: StudioGraphNode[];
  edges: StudioGraphEdge[];
  note: string;
}

/** Well-known Nexora packages (best-effort graph without full lockfile parse). */
const KNOWN_PACKAGES = [
  '@nexora.ts/core',
  '@nexora.ts/config',
  '@nexora.ts/logger',
  '@nexora.ts/websocket',
  '@nexora.ts/database',
  '@nexora.ts/api',
  '@nexora.ts/auth',
  '@nexora.ts/plugin-system',
  '@nexora.ts/cli',
  '@nexora.ts/dev-server',
  '@nexora.ts/ui',
] as const;

/**
 * Build a best-effort dependency graph from loaded plugins + known packages.
 */
export function buildStudioGraph(plugins: StudioGraphPlugin[]): StudioDependencyGraph {
  const nodes: StudioGraphNode[] = [
    {
      id: 'bot',
      label: 'Bot process',
      kind: 'bot',
    },
  ];
  const edges: StudioGraphEdge[] = [];

  for (const pkg of KNOWN_PACKAGES) {
    nodes.push({
      id: `pkg:${pkg}`,
      label: pkg,
      kind: 'package',
    });
  }

  // Core stack edges
  edges.push({ from: 'bot', to: 'pkg:@nexora.ts/core', kind: 'depends' });
  edges.push({ from: 'pkg:@nexora.ts/core', to: 'pkg:@nexora.ts/config', kind: 'depends' });
  edges.push({ from: 'pkg:@nexora.ts/core', to: 'pkg:@nexora.ts/logger', kind: 'depends' });
  edges.push({ from: 'bot', to: 'pkg:@nexora.ts/dev-server', kind: 'depends' });
  edges.push({
    from: 'pkg:@nexora.ts/dev-server',
    to: 'pkg:@nexora.ts/websocket',
    kind: 'depends',
  });

  for (const plugin of plugins) {
    const id = `plugin:${plugin.name}`;
    nodes.push({
      id,
      label: plugin.name,
      kind: 'plugin',
      version: plugin.version,
      meta: {
        enabled: plugin.enabled,
        commands: plugin.commands,
        events: plugin.events,
        description: plugin.description,
      },
    });
    edges.push({ from: 'bot', to: id, kind: 'loads' });
    edges.push({ from: id, to: 'pkg:@nexora.ts/core', kind: 'depends' });
    if (plugin.commands > 0) {
      edges.push({ from: id, to: 'pkg:@nexora.ts/core', kind: 'provides' });
    }
  }

  // Service nodes (logical)
  for (const svc of ['CommandRegistry', 'EventRegistry', 'EventBus', 'Cache', 'Scheduler'] as const) {
    const id = `service:${svc}`;
    nodes.push({ id, label: svc, kind: 'service' });
    edges.push({ from: 'pkg:@nexora.ts/core', to: id, kind: 'provides' });
  }

  return {
    nodes,
    edges,
    note:
      'Best-effort graph from loaded plugins + known @nexora.ts packages. Not a full lockfile parse.',
  };
}
