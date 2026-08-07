import { useMemo, useState } from 'react';
import { fetchGraph, type StudioGraphPayload } from '../api';
import { EmptyState } from './ui';
import { usePoll } from './usePoll';

export function GraphView({ active }: { active: boolean }) {
  const [data, setData] = useState<StudioGraphPayload>({ nodes: [], edges: [] });

  usePoll(
    async () => {
      setData(await fetchGraph());
    },
    5000,
    active,
  );

  const adjacency = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const n of data.nodes) map.set(n.id, []);
    for (const e of data.edges) {
      const list = map.get(e.from) ?? [];
      list.push(e.to);
      map.set(e.from, list);
      if (!map.has(e.to)) map.set(e.to, []);
    }
    return map;
  }, [data]);

  const roots = useMemo(() => {
    const targets = new Set(data.edges.map((e) => e.to));
    const r = data.nodes.filter((n) => !targets.has(n.id));
    return r.length > 0 ? r : data.nodes.slice(0, 1);
  }, [data]);

  const hasGraph = data.nodes.length > 0;

  return (
    <div className="two-col">
      <div className="panel">
        <div className="panel-head">
          <h2>Dependency graph</h2>
          <span className="muted">
            {data.nodes.length} nodes · {data.edges.length} edges
          </span>
        </div>
        <div className="panel-body">
          {!hasGraph ? (
            <EmptyState>
              {data.note ?? 'No dependency graph available yet.'}
            </EmptyState>
          ) : (
            <svg
              className="graph-svg"
              viewBox="0 0 640 360"
              role="img"
              aria-label="Dependency graph"
            >
              {data.edges.map((e, i) => {
                const from = data.nodes.find((n) => n.id === e.from);
                const to = data.nodes.find((n) => n.id === e.to);
                if (!from || !to) return null;
                const a = nodePos(data.nodes.indexOf(from), data.nodes.length);
                const b = nodePos(data.nodes.indexOf(to), data.nodes.length);
                return (
                  <line
                    key={`${e.from}-${e.to}-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className="graph-edge"
                  />
                );
              })}
              {data.nodes.map((n, i) => {
                const p = nodePos(i, data.nodes.length);
                return (
                  <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                    <circle r={18} className="graph-node" />
                    <text className="graph-label" textAnchor="middle" dy="32">
                      {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Tree view</h2>
        </div>
        <div className="panel-body">
          {!hasGraph ? (
            <EmptyState>Waiting for graph data…</EmptyState>
          ) : (
            <ul className="graph-tree">
              {roots.map((root) => (
                <GraphTreeNode
                  key={root.id}
                  id={root.id}
                  label={root.label}
                  kind={root.kind}
                  adjacency={adjacency}
                  nodes={data.nodes}
                  depth={0}
                  seen={new Set()}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function nodePos(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(Math.max(total, 1)));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: 80 + col * Math.min(140, 560 / Math.max(cols, 1)),
    y: 60 + row * 90,
  };
}

function GraphTreeNode({
  id,
  label,
  kind,
  adjacency,
  nodes,
  depth,
  seen,
}: {
  id: string;
  label: string;
  kind?: string;
  adjacency: Map<string, string[]>;
  nodes: StudioGraphPayload['nodes'];
  depth: number;
  seen: Set<string>;
}) {
  if (seen.has(id)) {
    return (
      <li className="graph-tree-item muted" style={{ paddingLeft: depth * 14 }}>
        {label} <span className="pill">cycle</span>
      </li>
    );
  }
  const next = new Set(seen);
  next.add(id);
  const children = adjacency.get(id) ?? [];
  return (
    <li className="graph-tree-item" style={{ paddingLeft: depth * 14 }}>
      <span className="evt-name">{label}</span>
      {kind && <span className="pill">{kind}</span>}
      {children.length > 0 && (
        <ul className="graph-tree">
          {children.map((cid) => {
            const n = nodes.find((x) => x.id === cid);
            return (
              <GraphTreeNode
                key={cid}
                id={cid}
                label={n?.label ?? cid}
                kind={n?.kind}
                adjacency={adjacency}
                nodes={nodes}
                depth={depth + 1}
                seen={next}
              />
            );
          })}
        </ul>
      )}
    </li>
  );
}
