/** Self-contained Studio UI served by @nexora.ts/dev-server (no Vite required). */
export function getStudioHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nexora Studio</title>
  <style>
    :root {
      --bg: #0b1020;
      --panel: #121a2f;
      --border: #24304d;
      --text: #e8eefc;
      --muted: #8b9bb8;
      --accent: #5b8cff;
      --ok: #3dd68c;
      --warn: #f5a524;
      --err: #f07178;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: radial-gradient(1200px 600px at 10% -10%, #1a2744, var(--bg));
      color: var(--text);
      min-height: 100vh;
    }
    .app { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
    .sidebar {
      border-right: 1px solid var(--border);
      background: rgba(10, 14, 28, 0.85);
      padding: 1.25rem 1rem;
    }
    .brand strong { display: block; font-size: 1.05rem; }
    .brand span { color: var(--muted); font-size: 0.8rem; }
    .nav { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .nav button {
      text-align: left;
      border: 0;
      background: transparent;
      color: var(--muted);
      padding: 0.55rem 0.7rem;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
    }
    .nav button.active, .nav button:hover {
      background: rgba(91, 140, 255, 0.12);
      color: var(--text);
    }
    .main { padding: 1.5rem 1.75rem; }
    .header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; margin-bottom: 1.25rem; }
    .header h1 { margin: 0 0 0.35rem; font-size: 1.4rem; }
    .header p { margin: 0; color: var(--muted); font-size: 0.9rem; }
    .badge {
      display: inline-flex; align-items: center; gap: 0.45rem;
      border: 1px solid var(--border); background: var(--panel);
      border-radius: 999px; padding: 0.4rem 0.75rem; font-size: 0.85rem; white-space: nowrap;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--warn); }
    .dot.ok { background: var(--ok); }
    .error-banner {
      border: 1px solid rgba(240, 113, 120, 0.4);
      background: rgba(240, 113, 120, 0.1);
      padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1rem;
    }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 0.75rem; }
    .card, .panel {
      background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
    }
    .card { padding: 1rem; }
    .card h3 { margin: 0; color: var(--muted); font-size: 0.8rem; font-weight: 600; }
    .card .value { margin-top: 0.4rem; font-size: 1.5rem; font-weight: 700; }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.85rem 1rem; border-bottom: 1px solid var(--border);
    }
    .panel-head h2 { margin: 0; font-size: 0.95rem; }
    .panel-body { padding: 1rem; }
    .list, .tree { list-style: none; margin: 0; padding: 0; }
    .list li, .tree li {
      display: flex; justify-content: space-between; gap: 1rem;
      padding: 0.45rem 0; border-bottom: 1px solid rgba(36, 48, 77, 0.6);
      font-size: 0.9rem;
    }
    .muted { color: var(--muted); }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .err { color: var(--err); }
    .pre {
      margin: 0; overflow: auto; max-height: 60vh; font-size: 0.8rem;
      background: #0a0f1c; padding: 0.85rem; border-radius: 8px;
    }
    .logs { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.78rem; }
    .log-line { display: grid; grid-template-columns: 180px 60px 1fr; gap: 0.6rem; padding: 0.25rem 0; }
    a.docs-link { color: var(--accent); }
    @media (max-width: 900px) {
      .app { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr 1fr; }
      .sidebar { border-right: 0; border-bottom: 1px solid var(--border); }
      .nav { flex-direction: row; flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <strong>Nexora Studio</strong>
        <span>Local Developer Center</span>
      </div>
      <nav class="nav" id="nav"></nav>
    </aside>
    <main class="main">
      <div class="header">
        <div>
          <h1 id="title">Overview</h1>
          <p>Project-specific runtime insights — secrets are redacted.</p>
        </div>
        <div class="badge" id="badge"><span class="dot" id="dot"></span><span id="badgeText">Connecting…</span></div>
      </div>
      <div id="error" class="error-banner" hidden></div>
      <div id="content"></div>
    </main>
  </div>
  <script>
    const TABS = [
      ['overview', 'Overview'],
      ['commands', 'Commands'],
      ['events', 'Events'],
      ['plugins', 'Plugins'],
      ['config', 'Configuration'],
      ['logs', 'Logs'],
      ['docs', 'Documentation'],
    ];
    let tab = 'overview';
    let snapshot = null;
    let logs = [];

    const nav = document.getElementById('nav');
    for (const [id, label] of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.id = id;
      btn.onclick = () => { tab = id; render(); };
      nav.appendChild(btn);
    }

    function formatUptime(ms) {
      if (ms == null) return '—';
      const s = Math.floor(ms / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return h + 'h ' + m + 'm ' + (s % 60) + 's';
    }

    function esc(s) {
      return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    }

    async function refresh() {
      const errEl = document.getElementById('error');
      try {
        const [snapRes, logsRes] = await Promise.all([
          fetch('/api/studio/snapshot'),
          fetch('/api/studio/logs'),
        ]);
        if (!snapRes.ok) throw new Error('Studio API unavailable (' + snapRes.status + ')');
        snapshot = await snapRes.json();
        logs = logsRes.ok ? await logsRes.json() : [];
        errEl.hidden = true;
      } catch (e) {
        errEl.hidden = false;
        errEl.textContent = e instanceof Error ? e.message : String(e);
      }
      render();
    }

    function render() {
      document.getElementById('title').textContent =
        (TABS.find(([id]) => id === tab) || ['', 'Studio'])[1];
      for (const btn of nav.querySelectorAll('button')) {
        btn.classList.toggle('active', btn.dataset.id === tab);
      }

      const online = snapshot?.bot?.online;
      document.getElementById('dot').className = 'dot' + (online ? ' ok' : '');
      document.getElementById('badgeText').textContent = online
        ? ('Online · ' + (snapshot.bot.tag || 'bot'))
        : snapshot
          ? ('Phase: ' + snapshot.bot.phase)
          : 'Connecting…';

      const el = document.getElementById('content');
      if (!snapshot && tab !== 'docs' && tab !== 'logs') {
        el.innerHTML = '<p class="muted">Waiting for Studio API…</p>';
        return;
      }

      if (tab === 'overview') {
        el.innerHTML =
          '<div class="grid">' +
          card('Commands', snapshot.commands.length) +
          card('Events', snapshot.events.length) +
          card('Plugins', snapshot.plugins.length) +
          card('Guilds', snapshot.bot.guilds) +
          '</div>' +
          '<div class="grid" style="grid-template-columns:1fr 1fr">' +
          panel('Bot status',
            '<ul class="list">' +
            row('Phase', snapshot.bot.phase) +
            row('Uptime', formatUptime(snapshot.bot.uptimeMs)) +
            row('Studio API', ':' + snapshot.meta.ports.api) +
            row('Studio UI', ':' + snapshot.meta.ports.studio) +
            '</ul>') +
          panel('Database',
            '<ul class="list">' +
            row('Provider', snapshot.database.provider || '—') +
            row('Status', snapshot.database.connected ? '<span class="ok">Connected</span>' : '<span class="warn">Not probed / offline</span>') +
            (snapshot.database.message ? row('Detail', '<span class="muted">' + esc(snapshot.database.message) + '</span>') : '') +
            '</ul>') +
          '</div>';
      } else if (tab === 'commands') {
        el.innerHTML = panel(
          'Command tree <span class="muted">' + snapshot.commands.length + ' found</span>',
          snapshot.commands.length
            ? '<ul class="tree"><li><span>/</span><span class="muted">root</span></li>' +
              snapshot.commands.map((c) =>
                '<li><span>├── ' + esc(c.name) + '</span><span class="muted">' + esc(c.description) + '</span></li>'
              ).join('') + '</ul>'
            : '<p class="muted">No commands registered yet.</p>',
        );
      } else if (tab === 'events') {
        el.innerHTML = panel(
          'Registered events',
          '<ul class="list">' +
            snapshot.events.map((e) =>
              '<li><span>' + esc(e.name) + '</span><span class="muted">' + (e.once ? 'once' : 'on') + '</span></li>'
            ).join('') + '</ul>',
        );
      } else if (tab === 'plugins') {
        el.innerHTML = panel(
          'Installed plugins',
          snapshot.plugins.length
            ? '<ul class="list">' +
              snapshot.plugins.map((p) =>
                '<li><span><span class="' + (p.enabled ? 'ok' : 'warn') + '">' +
                (p.enabled ? '✓' : '✗') + '</span> ' + esc(p.name) +
                ' <span class="muted">v' + esc(p.version) + '</span></span>' +
                '<span class="muted">' + p.commands + ' cmds · ' + p.events + ' events</span></li>'
              ).join('') + '</ul>'
            : '<p class="muted">No plugins loaded.</p>',
        );
      } else if (tab === 'config') {
        el.innerHTML = panel(
          'Active configuration <span class="muted">secrets redacted</span>',
          '<pre class="pre">' + esc(JSON.stringify(snapshot.config, null, 2)) + '</pre>',
        );
      } else if (tab === 'logs') {
        const lines = [...logs].reverse().map((l) =>
          '<div class="log-line"><span class="muted">' + esc(l.timestamp) + '</span>' +
          '<span class="' + (l.level === 'error' ? 'err' : l.level === 'warn' ? 'warn' : '') + '">' +
          esc(l.level) + '</span><span>' + esc((l.context ? '[' + l.context + '] ' : '') + l.message) +
          '</span></div>'
        ).join('');
        el.innerHTML = panel(
          'Live logs <span class="muted">' + logs.length + ' buffered</span>',
          '<div class="logs">' + (lines || '<p class="muted">Waiting for log events…</p>') + '</div>',
        );
      } else if (tab === 'docs') {
        el.innerHTML = panel(
          'Documentation',
          '<p><strong>Nexora Studio</strong> is your local control panel for this project.</p>' +
          '<p class="muted">Framework docs:</p>' +
          '<p><a class="docs-link" href="https://cjays-organization.gitbook.io/nexorajs" target="_blank" rel="noreferrer">https://cjays-organization.gitbook.io/nexorajs</a></p>',
        );
      }
    }

    function card(label, value) {
      return '<div class="card"><h3>' + esc(label) + '</h3><div class="value">' + esc(value) + '</div></div>';
    }
    function panel(title, body) {
      return '<div class="panel"><div class="panel-head"><h2>' + title + '</h2></div><div class="panel-body">' + body + '</div></div>';
    }
    function row(k, v) {
      return '<li><span>' + esc(k) + '</span><span>' + v + '</span></li>';
    }

    refresh();
    setInterval(refresh, 2500);
  </script>
</body>
</html>`;
}
