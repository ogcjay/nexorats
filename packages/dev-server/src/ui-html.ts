/** Self-contained Studio UI served by @nexora.ts/dev-server (no Vite required). */
export function getStudioHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nexora Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a0e16;
      --bg-elevated: #111827;
      --bg-soft: #161f2e;
      --bg-hover: #1a2436;
      --border: #243044;
      --border-strong: #334155;
      --text: #e8eef8;
      --muted: #8b9bb3;
      --cyan: #00e5ff;
      --cyan-dim: rgba(0, 229, 255, 0.12);
      --cyan-border: rgba(0, 229, 255, 0.28);
      --blurple: #5865f2;
      --blurple-dim: rgba(88, 101, 242, 0.14);
      --ok: #34d399;
      --ok-dim: rgba(52, 211, 153, 0.12);
      --warn: #fbbf24;
      --warn-dim: rgba(251, 191, 36, 0.12);
      --err: #f87171;
      --err-dim: rgba(248, 113, 113, 0.1);
      --font: 'IBM Plex Sans', ui-sans-serif, sans-serif;
      --mono: 'IBM Plex Mono', ui-monospace, monospace;
      --radius: 10px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font);
      background:
        radial-gradient(900px 480px at 0% -5%, rgba(0, 229, 255, 0.07), transparent 55%),
        radial-gradient(700px 400px at 100% 0%, rgba(88, 101, 242, 0.06), transparent 50%),
        var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 14px;
      line-height: 1.45;
    }
    button { font: inherit; }
    .app { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
    .sidebar {
      border-right: 1px solid var(--border);
      background: rgba(10, 14, 22, 0.92);
      padding: 1.15rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .brand { padding: 0 0.55rem; }
    .brand-mark {
      display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.2rem;
    }
    .brand-mark .logo {
      width: 28px; height: 28px; border-radius: 7px;
      background: linear-gradient(135deg, var(--cyan), var(--blurple));
      display: grid; place-items: center;
      font-family: var(--mono); font-weight: 600; font-size: 0.72rem; color: #041018;
    }
    .brand strong { display: block; font-size: 1.05rem; letter-spacing: -0.02em; }
    .brand span { color: var(--muted); font-size: 0.75rem; }
    .nav { display: flex; flex-direction: column; gap: 0.2rem; }
    .nav button {
      text-align: left; border: 0; background: transparent;
      color: var(--muted); padding: 0.5rem 0.7rem; border-radius: 8px;
      cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      gap: 0.5rem;
    }
    .nav button:hover { background: var(--bg-soft); color: var(--text); }
    .nav button.active {
      background: var(--cyan-dim); color: var(--cyan);
      box-shadow: inset 2px 0 0 var(--cyan);
    }
    .nav .count {
      font-family: var(--mono); font-size: 0.7rem;
      color: var(--muted); background: var(--bg-soft);
      padding: 0.1rem 0.4rem; border-radius: 999px;
    }
    .nav button.active .count { background: rgba(0, 229, 255, 0.18); color: var(--cyan); }
    .sidebar-foot {
      margin-top: auto; padding: 0.55rem;
      border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--muted);
    }
    .main { padding: 1.25rem 1.5rem 2rem; overflow: auto; min-width: 0; }
    .header {
      display: flex; justify-content: space-between; gap: 1rem;
      align-items: flex-start; margin-bottom: 1rem;
    }
    .header h1 { margin: 0; font-size: 1.35rem; letter-spacing: -0.03em; font-weight: 700; }
    .header p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem; }
    .header-actions { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; justify-content: flex-end; }
    .badge {
      display: inline-flex; align-items: center; gap: 0.45rem;
      border: 1px solid var(--border); background: var(--bg-elevated);
      border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; white-space: nowrap;
    }
    .badge .tag { font-family: var(--mono); color: var(--text); font-weight: 500; }
    .badge .phase { color: var(--muted); font-size: 0.75rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--warn); flex-shrink: 0; }
    .dot.ok { background: var(--ok); box-shadow: 0 0 0 3px var(--ok-dim); }
    .live-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      border: 1px solid var(--border); background: var(--bg-elevated);
      border-radius: 8px; padding: 0.4rem 0.65rem; font-size: 0.75rem;
      font-weight: 600; letter-spacing: 0.02em; white-space: nowrap;
    }
    .live-badge .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--muted); flex-shrink: 0;
    }
    .live-badge[data-state="live"] {
      color: var(--ok); border-color: rgba(52, 211, 153, 0.35); background: var(--ok-dim);
    }
    .live-badge[data-state="live"] .live-dot {
      background: var(--ok); box-shadow: 0 0 0 3px var(--ok-dim);
      animation: livePulse 1.8s ease-in-out infinite;
    }
    .live-badge[data-state="reconnecting"] {
      color: var(--warn); border-color: rgba(251, 191, 36, 0.35); background: var(--warn-dim);
    }
    .live-badge[data-state="reconnecting"] .live-dot { background: var(--warn); }
    .live-badge[data-state="offline"] { color: var(--muted); }
    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    .btn {
      border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text);
      border-radius: 8px; padding: 0.4rem 0.75rem; cursor: pointer; font-size: 0.8rem;
      display: inline-flex; align-items: center; gap: 0.35rem;
    }
    .btn:hover { border-color: var(--cyan-border); background: var(--bg-hover); }
    .btn:disabled { opacity: 0.55; cursor: default; }
    .btn-primary {
      background: var(--cyan-dim); border-color: var(--cyan-border); color: var(--cyan);
    }
    .error-banner {
      border: 1px solid rgba(248, 113, 113, 0.35); background: var(--err-dim);
      padding: 0.75rem 0.95rem; border-radius: var(--radius); margin-bottom: 0.85rem; color: #fecaca;
    }
    .stats {
      display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.6rem; margin-bottom: 0.85rem;
    }
    .stat {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 0.7rem 0.85rem;
    }
    .stat h3 {
      margin: 0; color: var(--muted); font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .stat .value {
      margin-top: 0.3rem; font-size: 1.35rem; font-weight: 700;
      letter-spacing: -0.03em; font-family: var(--mono);
    }
    .stat .sub { margin-top: 0.15rem; font-size: 0.72rem; color: var(--muted); }
    .panel {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden;
    }
    .panel + .panel { margin-top: 0.75rem; }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.7rem 0.9rem; border-bottom: 1px solid var(--border); gap: 0.75rem;
    }
    .panel-head h2 { margin: 0; font-size: 0.88rem; font-weight: 600; }
    .panel-body { padding: 0.85rem 0.9rem; }
    .panel-body.tight { padding: 0; }
    .split {
      display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
      gap: 0.75rem; align-items: start;
    }
    .list, .tree { list-style: none; margin: 0; padding: 0; }
    .list li {
      display: flex; justify-content: space-between; gap: 1rem; align-items: baseline;
      padding: 0.45rem 0; border-bottom: 1px solid rgba(36, 48, 68, 0.65); font-size: 0.85rem;
    }
    .list li:last-child { border-bottom: 0; }
    .cmd-row {
      display: grid; grid-template-columns: 1fr auto; gap: 0.35rem 0.75rem;
      padding: 0.55rem 0.85rem; border-bottom: 1px solid rgba(36, 48, 68, 0.65);
      cursor: pointer; align-items: start;
    }
    .cmd-row:hover { background: var(--bg-hover); }
    .cmd-row.active {
      background: var(--cyan-dim);
      box-shadow: inset 2px 0 0 var(--cyan);
    }
    .cmd-row:last-child { border-bottom: 0; }
    .cmd-name {
      font-family: var(--mono); font-weight: 500; font-size: 0.85rem;
      display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
    }
    .cmd-desc { color: var(--muted); font-size: 0.78rem; grid-column: 1 / -1; }
    .cmd-meta {
      display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: flex-end;
    }
    .pill {
      display: inline-flex; align-items: center; gap: 0.2rem;
      font-family: var(--mono); font-size: 0.65rem; font-weight: 500;
      padding: 0.12rem 0.4rem; border-radius: 5px;
      border: 1px solid var(--border); color: var(--muted); background: var(--bg-soft);
      white-space: nowrap;
    }
    .pill.cyan { color: var(--cyan); border-color: var(--cyan-border); background: var(--cyan-dim); }
    .pill.blurple { color: #a5b4fc; border-color: rgba(88,101,242,0.35); background: var(--blurple-dim); }
    .pill.ok { color: var(--ok); border-color: rgba(52,211,153,0.3); background: var(--ok-dim); }
    .pill.warn { color: var(--warn); border-color: rgba(251,191,36,0.3); background: var(--warn-dim); }
    .detail-empty {
      padding: 2rem 1rem; text-align: center; color: var(--muted); font-size: 0.85rem;
    }
    .detail-title {
      font-family: var(--mono); font-size: 1.05rem; font-weight: 600; margin: 0 0 0.25rem;
    }
    .kv { display: grid; gap: 0.35rem; margin: 0.75rem 0; }
    .kv-row {
      display: grid; grid-template-columns: 110px 1fr; gap: 0.5rem;
      font-size: 0.82rem; padding: 0.25rem 0;
      border-bottom: 1px solid rgba(36, 48, 68, 0.45);
    }
    .kv-row span:first-child { color: var(--muted); }
    .kv-row code { font-family: var(--mono); font-size: 0.78rem; }
    .opt-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-top: 0.5rem; }
    .opt-table th, .opt-table td {
      text-align: left; padding: 0.4rem 0.45rem;
      border-bottom: 1px solid rgba(36, 48, 68, 0.55);
    }
    .opt-table th { color: var(--muted); font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .opt-table code { font-family: var(--mono); }
    .muted { color: var(--muted); }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .err { color: var(--err); }
    .pre {
      margin: 0; overflow: auto; max-height: 62vh; font-size: 0.78rem;
      font-family: var(--mono); background: #070b12; padding: 0.85rem;
      border-radius: 8px; line-height: 1.5; border: 1px solid var(--border);
    }
    .logs { font-family: var(--mono); font-size: 0.75rem; max-height: 62vh; overflow: auto; }
    .log-line {
      display: grid; grid-template-columns: 168px 52px 1fr; gap: 0.55rem;
      padding: 0.28rem 0.15rem; border-bottom: 1px solid rgba(36, 48, 68, 0.4);
    }
    .evt-row, .plug-row {
      display: grid; grid-template-columns: 1fr auto; gap: 0.35rem 0.75rem;
      padding: 0.55rem 0.85rem; border-bottom: 1px solid rgba(36, 48, 68, 0.65);
      align-items: start;
    }
    .evt-row:last-child, .plug-row:last-child { border-bottom: 0; }
    .evt-name, .plug-name { font-family: var(--mono); font-weight: 500; font-size: 0.85rem; }
    .docs-hero { padding: 0.25rem 0 0.5rem; }
    .docs-hero h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
    a.docs-link { color: var(--cyan); text-decoration: none; }
    a.docs-link:hover { text-decoration: underline; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .filter-bar {
      display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center;
    }
    .filter-bar input {
      flex: 1; min-width: 140px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); padding: 0.4rem 0.65rem; font: inherit;
    }
    .filter-bar input:focus { outline: 1px solid var(--cyan-border); border-color: var(--cyan); }
    @media (max-width: 980px) {
      .app { grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .split, .two-col { grid-template-columns: 1fr; }
      .sidebar { border-right: 0; border-bottom: 1px solid var(--border); }
      .nav { flex-direction: row; flex-wrap: wrap; }
      .sidebar-foot { display: none; }
      .log-line { grid-template-columns: 1fr; gap: 0.1rem; }
    }
    @media (max-width: 640px) {
      .stats { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <div class="logo">NX</div>
          <div>
            <strong>Nexora Studio</strong>
            <span>Local Developer Center</span>
          </div>
        </div>
      </div>
      <nav class="nav" id="nav"></nav>
      <div class="sidebar-foot" id="sideMeta">API · —</div>
    </aside>
    <main class="main">
      <div class="header">
        <div>
          <h1 id="title">Overview</h1>
          <p id="subtitle">Project-specific runtime insights — secrets are redacted.</p>
        </div>
        <div class="header-actions">
          <div class="live-badge" id="liveBadge" data-state="offline" title="WebSocket">
            <span class="live-dot"></span>
            <span id="liveText">Offline</span>
          </div>
          <button type="button" class="btn" id="refreshBtn" title="Refresh now">↻ Refresh</button>
          <div class="badge" id="badge">
            <span class="dot" id="dot"></span>
            <span id="badgeText">Connecting…</span>
          </div>
        </div>
      </div>
      <div id="error" class="error-banner" hidden></div>
      <div id="stats" class="stats" hidden></div>
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
    const SUBTITLES = {
      overview: 'Live bot metrics from the Studio API.',
      commands: 'Registered slash, group, context, and message commands.',
      events: 'Discord event listeners attached to this process.',
      plugins: 'Loaded plugins and their contribution counts.',
      config: 'Active configuration — tokens and secrets redacted.',
      logs: 'Buffered runtime logs from this bot process.',
      docs: 'Framework documentation and local ports.',
    };
    let tab = 'overview';
    let snapshot = null;
    let logs = [];
    let selectedCmd = null;
    let cmdFilter = '';
    let refreshing = false;
    let liveState = 'offline';
    let ws = null;
    let reconnectAttempt = 0;
    let reconnectTimer = null;
    let pollTimer = null;

    const nav = document.getElementById('nav');
    for (const [id, label] of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<span>' + label + '</span><span class="count" data-count="' + id + '" hidden></span>';
      btn.dataset.id = id;
      btn.onclick = () => { tab = id; selectedCmd = null; render(); };
      nav.appendChild(btn);
    }

    document.getElementById('refreshBtn').onclick = () => refresh(true);

    function setLiveState(state) {
      liveState = state;
      const badge = document.getElementById('liveBadge');
      const text = document.getElementById('liveText');
      if (!badge || !text) return;
      badge.dataset.state = state;
      text.textContent =
        state === 'live' ? 'Live' : state === 'reconnecting' ? 'Reconnecting' : 'Offline';
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    function startPollingFallback() {
      if (pollTimer) return;
      pollTimer = setInterval(() => refresh(false), 2500);
    }

    function wsUrl() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Same host as Studio UI (embedded proxies /ws; Vite proxies /ws → API)
      return proto + '//' + location.host + '/ws';
    }

    function applyState(nextSnapshot, nextLogs) {
      if (nextSnapshot) snapshot = nextSnapshot;
      if (nextLogs) logs = nextLogs;
      document.getElementById('error').hidden = true;
      render();
    }

    function connectWs() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        ws = new WebSocket(wsUrl());
      } catch (_) {
        setLiveState(reconnectAttempt > 0 ? 'reconnecting' : 'offline');
        startPollingFallback();
        scheduleReconnect();
        return;
      }

      if (reconnectAttempt > 0) setLiveState('reconnecting');

      ws.onopen = () => {
        reconnectAttempt = 0;
        setLiveState('live');
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'studio:state' && msg.payload) {
            applyState(msg.payload.snapshot, msg.payload.logs);
          } else if (msg.type === 'studio:snapshot') {
            applyState(msg.payload, null);
          } else if (msg.type === 'studio:logs') {
            applyState(null, msg.payload);
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        ws = null;
        setLiveState('reconnecting');
        startPollingFallback();
        scheduleReconnect();
      };

      ws.onerror = () => {
        /* onclose handles reconnect */
      };
    }

    function scheduleReconnect() {
      if (reconnectTimer) return;
      const delay = Math.min(10000, 600 * Math.pow(1.7, reconnectAttempt));
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWs();
      }, delay);
    }

    function formatUptime(ms) {
      if (ms == null) return '—';
      const s = Math.floor(ms / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return h + 'h ' + m + 'm ' + (s % 60) + 's';
    }

    function formatCooldown(ms) {
      if (ms == null || ms === 0) return '—';
      if (ms < 1000) return ms + 'ms';
      return (ms / 1000) + 's';
    }

    function esc(s) {
      return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    }

    function typeLabel(t) {
      if (t === 'slash') return 'slash';
      if (t === 'group') return 'group';
      if (t === 'context-user') return 'user ctx';
      if (t === 'context-message') return 'msg ctx';
      if (t === 'message') return 'message';
      return t || 'slash';
    }

    function typePill(t) {
      const cls = t === 'slash' ? 'cyan' : t === 'group' ? 'blurple' : '';
      return '<span class="pill ' + cls + '">' + esc(typeLabel(t)) + '</span>';
    }

    async function refresh(manual) {
      if (refreshing) return;
      refreshing = true;
      const btn = document.getElementById('refreshBtn');
      if (manual) btn.disabled = true;
      const errEl = document.getElementById('error');
      try {
        const [snapRes, logsRes] = await Promise.all([
          fetch('/api/studio/snapshot'),
          fetch('/api/studio/logs'),
        ]);
        if (!snapRes.ok) {
          let detail = '';
          try {
            const body = await snapRes.json();
            if (body && body.error) detail = ': ' + body.error;
          } catch (_) {}
          throw new Error('Studio API unavailable (' + snapRes.status + ')' + detail);
        }
        snapshot = await snapRes.json();
        logs = logsRes.ok ? await logsRes.json() : [];
        errEl.hidden = true;
      } catch (e) {
        errEl.hidden = false;
        errEl.textContent = e instanceof Error ? e.message : String(e);
      } finally {
        refreshing = false;
        btn.disabled = false;
      }
      render();
    }

    function updateNavCounts() {
      if (!snapshot) return;
      const c = snapshot.meta?.counts || {};
      const map = {
        commands: c.commands ?? snapshot.commands.length,
        events: c.events ?? snapshot.events.length,
        plugins: c.plugins ?? snapshot.plugins.length,
        logs: logs.length,
      };
      for (const [id, n] of Object.entries(map)) {
        const el = nav.querySelector('[data-count="' + id + '"]');
        if (!el) continue;
        el.hidden = false;
        el.textContent = String(n);
      }
    }

    function renderStatsBar() {
      const el = document.getElementById('stats');
      if (!snapshot || tab === 'docs') {
        el.hidden = true;
        el.innerHTML = '';
        return;
      }
      const c = snapshot.meta?.counts || {};
      const uptime = formatUptime(snapshot.bot.uptimeMs);
      el.hidden = false;
      el.innerHTML =
        stat('Commands', c.commands ?? snapshot.commands.length, (c.slash != null ? c.slash + ' slash' : null)) +
        stat('Events', c.events ?? snapshot.events.length) +
        stat('Plugins', c.plugins ?? snapshot.plugins.length) +
        stat('Guilds', snapshot.bot.guilds) +
        stat('Uptime', uptime);
    }

    function stat(label, value, sub) {
      return '<div class="stat"><h3>' + esc(label) + '</h3><div class="value">' +
        esc(value) + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
    }

    function render() {
      document.getElementById('title').textContent =
        (TABS.find(([id]) => id === tab) || ['', 'Studio'])[1];
      document.getElementById('subtitle').textContent = SUBTITLES[tab] || '';
      for (const btn of nav.querySelectorAll('button')) {
        btn.classList.toggle('active', btn.dataset.id === tab);
      }

      const online = snapshot?.bot?.online;
      document.getElementById('dot').className = 'dot' + (online ? ' ok' : '');
      const badge = document.getElementById('badgeText');
      if (online) {
        badge.innerHTML = '<span class="ok" style="font-size:0.75rem;font-weight:600">Online</span> · <span class="tag">' +
          esc(snapshot.bot.tag || 'bot') + '</span>';
      } else if (snapshot) {
        badge.innerHTML = '<span class="phase">Phase: ' + esc(snapshot.bot.phase) + '</span>';
      } else {
        badge.textContent = 'Connecting…';
      }

      if (snapshot?.meta?.ports) {
        document.getElementById('sideMeta').textContent =
          'API :' + snapshot.meta.ports.api + ' · UI :' + snapshot.meta.ports.studio +
          ' · v' + (snapshot.meta.apiVersion || '—');
      }

      updateNavCounts();
      renderStatsBar();

      const el = document.getElementById('content');
      if (!snapshot && tab !== 'docs' && tab !== 'logs') {
        el.innerHTML = '<p class="muted">Waiting for Studio API…</p>';
        return;
      }

      if (tab === 'overview') renderOverview(el);
      else if (tab === 'commands') renderCommands(el);
      else if (tab === 'events') renderEvents(el);
      else if (tab === 'plugins') renderPlugins(el);
      else if (tab === 'config') renderConfig(el);
      else if (tab === 'logs') renderLogs(el);
      else if (tab === 'docs') renderDocs(el);
    }

    function renderOverview(el) {
      const c = snapshot.meta?.counts || {};
      el.innerHTML =
        '<div class="two-col">' +
        panel('Bot status',
          '<ul class="list">' +
          row('Status', onlineBadge()) +
          row('Tag', esc(snapshot.bot.tag || '—')) +
          row('User ID', snapshot.bot.id ? '<code>' + esc(snapshot.bot.id) + '</code>' : '—') +
          row('Phase', esc(snapshot.bot.phase)) +
          row('Uptime', formatUptime(snapshot.bot.uptimeMs)) +
          row('Started', snapshot.bot.startedAt ? esc(new Date(snapshot.bot.startedAt).toLocaleString()) : '—') +
          row('Guilds', String(snapshot.bot.guilds)) +
          '</ul>') +
        panel('Runtime',
          '<ul class="list">' +
          row('Slash commands', String(c.slash ?? '—')) +
          row('Command groups', String(c.groups ?? '—')) +
          row('Context menus', String(c.contextMenus ?? '—')) +
          row('Message commands', String(c.messageCommands ?? '—')) +
          row('Events', String(c.events ?? snapshot.events.length)) +
          row('Plugins', String(c.plugins ?? snapshot.plugins.length)) +
          row('Studio API', ':' + snapshot.meta.ports.api) +
          row('Studio UI', ':' + snapshot.meta.ports.studio + ' · ' + esc(snapshot.meta.ui || '—')) +
          '</ul>') +
        '</div>' +
        '<div style="margin-top:0.75rem">' +
        panel('Database',
          '<ul class="list">' +
          row('Provider', esc(snapshot.database.provider || '—')) +
          row('Status', snapshot.database.connected
            ? '<span class="ok">Connected</span>'
            : '<span class="warn">Not probed / offline</span>') +
          (snapshot.database.message
            ? row('Detail', '<span class="muted">' + esc(snapshot.database.message) + '</span>')
            : '') +
          '</ul>') +
        '</div>';
    }

    function onlineBadge() {
      return snapshot.bot.online
        ? '<span class="pill ok">online</span>'
        : '<span class="pill warn">offline</span>';
    }

    function renderCommands(el) {
      const cmds = snapshot.commands || [];
      const q = cmdFilter.trim().toLowerCase();
      const filtered = q
        ? cmds.filter((c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q) ||
            (c.type || '').toLowerCase().includes(q))
        : cmds;

      const sel = cmds.find((c) => cmdKey(c) === selectedCmd) || null;

      const listHtml = filtered.length
        ? filtered.map((c) => {
            const key = cmdKey(c);
            const active = selectedCmd === key ? ' active' : '';
            const flags = [];
            if (c.guildOnly) flags.push('<span class="pill warn">guild</span>');
            if (c.adminOnly) flags.push('<span class="pill warn">admin</span>');
            if (c.guardsCount > 0) flags.push('<span class="pill">' + c.guardsCount + ' guards</span>');
            if (c.optionsCount > 0) flags.push('<span class="pill">' + c.optionsCount + ' opts</span>');
            if (c.subcommands != null) flags.push('<span class="pill">' + c.subcommands + ' subs</span>');
            if (c.cooldownMs) flags.push('<span class="pill">' + formatCooldown(c.cooldownMs) + '</span>');
            return '<div class="cmd-row' + active + '" data-cmd="' + esc(key) + '">' +
              '<div class="cmd-name">' + typePill(c.type) + '<span>/' + esc(c.name) + '</span></div>' +
              '<div class="cmd-meta">' + flags.join('') + '</div>' +
              '<div class="cmd-desc">' + esc(c.description || 'No description') + '</div>' +
              '</div>';
          }).join('')
        : '<div class="detail-empty">No commands match.</div>';

      el.innerHTML =
        '<div class="split">' +
        '<div class="panel">' +
          '<div class="panel-head"><h2>Command registry</h2><span class="muted">' +
            filtered.length + (q ? ' / ' + cmds.length : '') + '</span></div>' +
          '<div class="panel-body" style="padding:0.65rem 0.85rem;border-bottom:1px solid var(--border)">' +
            '<div class="filter-bar"><input id="cmdFilter" type="search" placeholder="Filter by name, type…" value="' +
            esc(cmdFilter) + '" /></div></div>' +
          '<div class="panel-body tight">' + listHtml + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><h2>Details</h2></div>' +
          '<div class="panel-body" id="cmdDetail">' + renderCmdDetail(sel) + '</div>' +
        '</div></div>';

      const input = document.getElementById('cmdFilter');
      if (input) {
        input.oninput = (e) => { cmdFilter = e.target.value; renderCommands(el); };
      }
      for (const row of el.querySelectorAll('.cmd-row')) {
        row.onclick = () => {
          selectedCmd = row.dataset.cmd;
          renderCommands(el);
        };
      }
    }

    function cmdKey(c) {
      return (c.type || 'slash') + ':' + c.name;
    }

    function renderCmdDetail(c) {
      if (!c) {
        return '<div class="detail-empty">Select a command to inspect options, cooldown, and flags.</div>';
      }
      let opts = '';
      if (c.options && c.options.length) {
        opts = '<table class="opt-table"><thead><tr><th>Name</th><th>Type</th><th>Req</th><th>Description</th></tr></thead><tbody>' +
          c.options.map((o) =>
            '<tr><td><code>' + esc(o.name) + '</code></td><td>' + esc(o.type) + '</td><td>' +
            (o.required ? 'yes' : '—') + '</td><td class="muted">' + esc(o.description) + '</td></tr>'
          ).join('') + '</tbody></table>';
      } else {
        opts = '<p class="muted" style="margin:0.5rem 0 0;font-size:0.8rem">No options.</p>';
      }

      return '<div class="detail-title">/' + esc(c.name) + '</div>' +
        '<div class="muted" style="font-size:0.82rem">' + esc(c.description || '') + '</div>' +
        '<div style="margin-top:0.55rem;display:flex;flex-wrap:wrap;gap:0.3rem">' +
          typePill(c.type) +
          (c.guildOnly ? '<span class="pill warn">guildOnly</span>' : '') +
          (c.adminOnly ? '<span class="pill warn">adminOnly</span>' : '') +
          (c.guardsCount ? '<span class="pill">' + c.guardsCount + ' guards</span>' : '') +
        '</div>' +
        '<div class="kv">' +
          kv('Source', c.source ? '<code>' + esc(c.source) + '</code>' : '—') +
          kv('Cooldown', formatCooldown(c.cooldownMs)) +
          kv('Options', String(c.optionsCount ?? 0)) +
          (c.subcommands != null ? kv('Subcommands', String(c.subcommands)) : '') +
          (c.aliases?.length ? kv('Aliases', c.aliases.map((a) => esc(a)).join(', ')) : '') +
        '</div>' +
        '<div style="font-size:0.78rem;font-weight:600;margin-top:0.35rem">Options</div>' +
        opts;
    }

    function kv(k, v) {
      return '<div class="kv-row"><span>' + esc(k) + '</span><span>' + v + '</span></div>';
    }

    function renderEvents(el) {
      const events = snapshot.events || [];
      el.innerHTML = panel(
        'Registered events <span class="muted">' + events.length + '</span>',
        events.length
          ? '<div class="panel-body tight">' + events.map((e) =>
              '<div class="evt-row"><div><div class="evt-name">' + esc(e.name) + '</div>' +
              (e.source ? '<div class="muted" style="font-size:0.75rem;margin-top:0.15rem">' + esc(e.source) + '</div>' : '') +
              '</div><div class="cmd-meta">' +
              '<span class="pill ' + (e.once ? 'warn' : 'cyan') + '">' + (e.once ? 'once' : 'on') + '</span>' +
              '</div></div>'
            ).join('') + '</div>'
          : '<p class="muted">No events registered.</p>',
        true,
      );
    }

    function renderPlugins(el) {
      const plugins = snapshot.plugins || [];
      el.innerHTML = panel(
        'Installed plugins <span class="muted">' + plugins.length + '</span>',
        plugins.length
          ? '<div class="panel-body tight">' + plugins.map((p) =>
              '<div class="plug-row"><div><div class="plug-name">' +
              '<span class="' + (p.enabled ? 'ok' : 'warn') + '">' + (p.enabled ? '●' : '○') + '</span> ' +
              esc(p.name) + ' <span class="muted">v' + esc(p.version) + '</span></div>' +
              (p.description ? '<div class="muted" style="font-size:0.78rem;margin-top:0.2rem">' + esc(p.description) + '</div>' : '') +
              '</div><div class="cmd-meta">' +
              '<span class="pill">' + p.commands + ' cmds</span>' +
              '<span class="pill">' + p.events + ' events</span>' +
              '<span class="pill ' + (p.enabled ? 'ok' : 'warn') + '">' + (p.enabled ? 'enabled' : 'disabled') + '</span>' +
              '</div></div>'
            ).join('') + '</div>'
          : '<p class="muted">No plugins loaded.</p>',
        true,
      );
    }

    function renderConfig(el) {
      el.innerHTML = panel(
        'Active configuration <span class="muted">secrets redacted</span>',
        '<pre class="pre">' + esc(JSON.stringify(snapshot.config, null, 2)) + '</pre>',
      );
    }

    function renderLogs(el) {
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
    }

    function renderDocs(el) {
      el.innerHTML =
        '<div class="panel"><div class="panel-body docs-hero">' +
        '<h3>Nexora.js documentation</h3>' +
        '<p class="muted" style="margin:0 0 0.75rem">Studio is your local control panel. Framework guides live on GitBook.</p>' +
        '<p><a class="docs-link" href="https://cjays-organization.gitbook.io/nexorajs" target="_blank" rel="noreferrer">' +
        'https://cjays-organization.gitbook.io/nexorajs</a></p>' +
        '</div></div>' +
        '<div style="margin-top:0.75rem">' +
        panel('Local ports',
          '<ul class="list">' +
          row('Nexora Studio', 'http://localhost:3002') +
          row('Studio API', 'http://127.0.0.1:3920') +
          row('Dashboard', 'http://localhost:3000') +
          '</ul>') +
        '</div>';
    }

    function panel(title, body, tightBody) {
      if (tightBody) {
        return '<div class="panel"><div class="panel-head"><h2>' + title + '</h2></div>' + body + '</div>';
      }
      return '<div class="panel"><div class="panel-head"><h2>' + title + '</h2></div><div class="panel-body">' + body + '</div></div>';
    }
    function row(k, v) {
      return '<li><span>' + esc(k) + '</span><span>' + v + '</span></li>';
    }

    refresh();
    connectWs();
    // HTTP fallback until WS is live (also used while reconnecting)
    startPollingFallback();
  </script>
</body>
</html>`;
}
