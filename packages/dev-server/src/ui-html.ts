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
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #100f0e;
      --bg-panel: #161514;
      --bg-raised: #1c1b19;
      --bg-hover: #222120;
      --bg-inset: #0b0a0a;
      --line: #282624;
      --line-soft: #201e1d;
      --line-strong: #3a3733;
      --text: #eeece7;
      --text-dim: #a8a49b;
      --text-mute: #74706a;
      --accent: #e3a343;
      --accent-line: rgba(227, 163, 67, 0.4);
      --ok: #6fa878;
      --warn: #d8a24b;
      --err: #d4705f;
      --font: 'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --mono: 'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, monospace;
      --r: 4px;
      --sidebar-w: 228px;
    }
    * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #34312e transparent; }
    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-thumb {
      background: #34312e; border: 3px solid transparent;
      background-clip: content-box; border-radius: 6px;
    }
    *::-webkit-scrollbar-thumb:hover { background: #47433e; background-clip: content-box; }
    body {
      margin: 0; min-height: 100vh;
      background: var(--bg); color: var(--text);
      font-family: var(--font); font-size: 13px; line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    button, input, a, table { font: inherit; }
    ::selection { background: rgba(227, 163, 67, 0.26); color: var(--text); }
    :focus-visible { outline: 1px solid var(--accent); outline-offset: 1px; }

    /* micro-typography */
    .nav-label, .panel-head h2, .section-label, .metric h3,
    .opt-table th, .pill, .live-badge {
      font-family: var(--mono); font-size: 10px; font-weight: 500;
      letter-spacing: 0.12em; text-transform: uppercase;
    }

    .app { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }
    .sidebar {
      position: sticky; top: 0; height: 100vh;
      display: flex; flex-direction: column; gap: 20px;
      padding: 20px 12px 12px;
      background: var(--bg); border-right: 1px solid var(--line); z-index: 20;
    }
    .brand { padding: 0 6px; }
    .brand strong {
      display: block; font-size: 16px; font-weight: 600;
      letter-spacing: -0.03em; line-height: 1.1; color: var(--text);
    }
    .brand strong em { font-style: normal; font-weight: 400; color: var(--text-mute); }
    .brand span {
      display: block; margin-top: 5px; font-family: var(--mono); font-size: 9.5px;
      font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute);
    }
    .nav { display: flex; flex-direction: column; gap: 1px; }
    .nav-label { color: var(--text-mute); padding: 0 6px 6px; }
    .nav button {
      position: relative; display: flex; align-items: center; justify-content: space-between;
      gap: 8px; width: 100%; text-align: left; border: 0; border-radius: 3px;
      background: transparent; color: var(--text-dim);
      padding: 6px 8px 6px 11px; font-size: 13px; cursor: pointer;
      transition: background 0.12s linear, color 0.12s linear;
    }
    .nav button::before {
      content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
      width: 2px; background: var(--accent); opacity: 0;
    }
    .nav button:hover { background: var(--bg-raised); color: var(--text); }
    .nav button.active { background: var(--bg-raised); color: var(--text); }
    .nav button.active::before { opacity: 1; }
    .nav .count {
      font-family: var(--mono); font-size: 10.5px;
      font-variant-numeric: tabular-nums; color: var(--text-mute);
    }
    .nav button.active .count { color: var(--text-dim); }
    .sidebar-foot {
      margin-top: auto; padding: 10px 6px 2px; border-top: 1px solid var(--line);
      font-family: var(--mono); font-size: 10.5px; color: var(--text-mute);
    }
    .sidebar-foot .sidebar-live {
      padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--line-soft);
    }
    .foot-row { display: flex; justify-content: space-between; gap: 8px; padding: 1.5px 0; }
    .foot-row span:last-child { color: var(--text-dim); font-variant-numeric: tabular-nums; }

    .main { display: flex; flex-direction: column; min-width: 0; overflow: auto; }
    .chrome {
      position: sticky; top: 0; z-index: 10;
      display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;
      padding: 18px 22px 14px; background: var(--bg); border-bottom: 1px solid var(--line);
    }
    .chrome-title h1 {
      margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.2;
    }
    .chrome-title p { margin: 3px 0 0; max-width: 52ch; color: var(--text-mute); font-size: 12px; }
    .header-actions {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
    }
    .main-body { flex: 1; padding: 16px 22px 28px; }
    .page-enter { animation: pageEnter 0.14s linear both; }
    @keyframes pageEnter { from { opacity: 0; } to { opacity: 1; } }

    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; white-space: nowrap; color: var(--text-dim);
    }
    .badge .tag { font-family: var(--mono); font-size: 11.5px; color: var(--text); }
    .badge .phase { font-size: 11.5px; color: var(--text-mute); }
    .dot { width: 6px; height: 6px; border-radius: 1px; background: var(--text-mute); flex-shrink: 0; }
    .dot.ok { background: var(--ok); }
    .live-badge {
      display: inline-flex; align-items: center; gap: 7px;
      color: var(--text-mute); white-space: nowrap;
    }
    .live-badge .live-dot {
      width: 6px; height: 6px; border-radius: 1px; background: currentColor; flex-shrink: 0;
    }
    .live-badge[data-state="live"] { color: var(--ok); }
    .live-badge[data-state="reconnecting"] { color: var(--warn); }
    .live-badge[data-state="offline"] { color: var(--text-mute); }
    .live-badge[data-state="offline"] .live-dot {
      background: transparent; box-shadow: inset 0 0 0 1px currentColor;
    }

    .btn {
      border: 1px solid var(--line); border-radius: 3px; background: var(--bg-panel);
      color: var(--text-dim); padding: 5px 10px; font-size: 12px; cursor: pointer;
      transition: border-color 0.12s linear, background 0.12s linear, color 0.12s linear;
    }
    .btn:hover:not(:disabled) {
      border-color: var(--line-strong); background: var(--bg-hover); color: var(--text);
    }
    .btn:disabled { opacity: 0.45; cursor: default; }
    .error-banner {
      border: 1px solid rgba(212, 112, 95, 0.35); border-left: 2px solid var(--err);
      border-radius: var(--r); background: rgba(212, 112, 95, 0.07); color: #e9b3a8;
      padding: 10px 12px; margin-bottom: 14px; font-size: 12.5px;
    }
    .error-banner code { font-family: var(--mono); font-size: 11.5px; }

    .metrics {
      display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
      border: 1px solid var(--line); border-radius: var(--r); background: var(--bg-panel);
      margin-bottom: 14px; overflow: hidden;
    }
    .metric { padding: 11px 14px 12px; border-left: 1px solid var(--line); min-width: 0; }
    .metric:first-child { border-left: 0; }
    .metric h3 { margin: 0; color: var(--text-mute); }
    .metric .value {
      margin-top: 6px; font-family: var(--mono); font-size: 21px; font-weight: 500;
      letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1.05;
      color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .metric .sub { margin-top: 3px; font-size: 11px; color: var(--text-mute); }

    .panel {
      background: var(--bg-panel); border: 1px solid var(--line);
      border-radius: var(--r); overflow: hidden;
    }
    .panel + .panel { margin-top: 10px; }
    .panel-head {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 9px 14px; border-bottom: 1px solid var(--line);
    }
    .panel-head h2 { margin: 0; color: var(--text-dim); }
    .panel-body { padding: 12px 14px; }
    .panel-body.tight { padding: 0; }
    .panel-body.filter-pad { padding: 8px 10px; border-bottom: 1px solid var(--line); }
    .split {
      display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
      gap: 10px; align-items: start;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
    .stack-gap { margin-top: 10px; }

    .list { list-style: none; margin: 0; padding: 0; }
    .list li {
      display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
      padding: 6px 0; border-bottom: 1px solid var(--line-soft); font-size: 12.5px;
    }
    .list li:last-child { border-bottom: 0; }
    .list li > span:first-child { color: var(--text-mute); }
    .list li > span:last-child { text-align: right; font-variant-numeric: tabular-nums; }
    .list code, .kv-row code { font-family: var(--mono); font-size: 11.5px; color: var(--text-dim); }

    .cmd-row, .evt-row, .plug-row {
      position: relative; display: grid; grid-template-columns: 1fr auto;
      gap: 3px 12px; align-items: start; padding: 9px 14px;
      border: 0; border-bottom: 1px solid var(--line-soft); border-radius: 0;
      background: transparent; color: inherit; text-align: left; width: 100%;
      transition: background 0.1s linear;
    }
    .cmd-row { cursor: pointer; }
    .cmd-row:hover, .evt-row:hover, .plug-row:hover { background: var(--bg-raised); }
    .cmd-row:last-child, .evt-row:last-child, .plug-row:last-child { border-bottom: 0; }
    .cmd-row.active { background: var(--bg-hover); box-shadow: inset 2px 0 0 var(--accent); }
    .cmd-name, .evt-name, .plug-name {
      display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
      font-family: var(--mono); font-size: 12.5px; font-weight: 500;
      letter-spacing: -0.01em; color: var(--text);
    }
    .cmd-desc {
      grid-column: 1 / -1; color: var(--text-mute); font-size: 11.5px; line-height: 1.4;
    }
    .cmd-meta { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }

    .pill {
      display: inline-flex; align-items: center; padding: 1px 5px;
      border: 1px solid var(--line); border-radius: 2px;
      color: var(--text-mute); background: transparent;
      letter-spacing: 0.08em; white-space: nowrap;
    }
    .pill.strong { color: var(--text-dim); border-color: var(--line-strong); }
    .pill.accent { color: var(--accent); border-color: var(--accent-line); }
    .pill.ok { color: var(--ok); border-color: rgba(111, 168, 120, 0.4); }
    .pill.warn { color: var(--warn); border-color: rgba(216, 162, 75, 0.4); }
    .pill.err { color: var(--err); border-color: rgba(212, 112, 95, 0.4); }

    .detail-empty { padding: 44px 20px; text-align: center; color: var(--text-mute); font-size: 12.5px; }
    .detail-title {
      margin: 0 0 3px; font-family: var(--mono); font-size: 16px; font-weight: 500;
      letter-spacing: -0.02em; color: var(--text);
    }
    .detail-sub { color: var(--text-mute); font-size: 12px; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
    .row-sub { margin-top: 2px; color: var(--text-mute); font-size: 11.5px; }
    .empty-note { margin: 0; padding: 14px; color: var(--text-mute); font-size: 12.5px; }
    .empty-note.inline { padding: 8px 0 0; }
    .kv { display: grid; margin: 12px 0; border-top: 1px solid var(--line-soft); }
    .kv-row {
      display: grid; grid-template-columns: 96px 1fr; gap: 10px;
      padding: 5px 0; border-bottom: 1px solid var(--line-soft); font-size: 12px;
    }
    .kv-row span:first-child { color: var(--text-mute); }
    .opt-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .opt-table th, .opt-table td {
      text-align: left; padding: 5px 8px 5px 0;
      border-bottom: 1px solid var(--line-soft); vertical-align: top;
    }
    .opt-table th { color: var(--text-mute); padding-bottom: 6px; }
    .opt-table code { font-family: var(--mono); font-size: 11.5px; color: var(--text); }
    .section-label { margin-top: 14px; color: var(--text-mute); }

    .filter-bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .filter-bar input {
      flex: 1; min-width: 140px; background: var(--bg-inset); border: 1px solid var(--line);
      border-radius: 3px; color: var(--text); padding: 6px 9px; font-size: 12.5px;
      transition: border-color 0.12s linear;
    }
    .filter-bar input:focus { outline: none; border-color: var(--accent-line); }
    .filter-bar input::placeholder { color: var(--text-mute); }

    .muted { color: var(--text-mute); }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .err { color: var(--err); }
    .pre {
      margin: 0; white-space: pre-wrap; word-break: break-word;
      font-family: var(--mono); font-size: 11.5px; line-height: 1.6; color: var(--text-dim);
      background: var(--bg-inset); padding: 12px 14px; border: 1px solid var(--line);
      border-radius: 3px; max-height: 62vh; overflow: auto;
    }

    .logs-panel .panel-body.logs { padding: 0; }
    .logs {
      max-height: calc(100vh - 240px); min-height: 300px; overflow: auto;
      background: var(--bg-inset); font-family: var(--mono); font-size: 11.5px; line-height: 1.6;
    }
    .log-line {
      display: grid; grid-template-columns: 92px 44px 1fr; gap: 12px;
      padding: 2px 14px; border-left: 2px solid transparent;
    }
    .log-line:hover { background: rgba(255, 255, 255, 0.025); }
    .log-line.is-warn { border-left-color: var(--warn); }
    .log-line.is-err { border-left-color: var(--err); }
    .log-line.is-cmd { border-left-color: #8b6bb8; }
    .log-line .ts { color: var(--text-mute); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .log-line .lvl {
      text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em;
      color: var(--text-mute); padding-top: 1px;
    }
    .log-line .lvl.err { color: var(--err); }
    .log-line .lvl.warn { color: var(--warn); }
    .log-line .lvl.cmd { color: #b39ddb; }
    .log-line .msg { color: var(--text-dim); word-break: break-word; }
    .log-line .msg .meta { color: var(--text-mute); }
    .log-line.is-err .msg { color: var(--text); }

    .docs-hero { padding: 26px 22px 24px; }
    .docs-hero h3 { margin: 0 0 8px; font-size: 22px; font-weight: 600; letter-spacing: -0.03em; }
    a.docs-link {
      color: var(--text); font-family: var(--mono); font-size: 12.5px; text-decoration: none;
      border-bottom: 1px solid var(--accent-line); padding-bottom: 1px;
    }
    a.docs-link:hover { color: var(--accent); border-bottom-color: var(--accent); }

    @media (max-width: 1020px) {
      .app { grid-template-columns: 1fr; }
      .sidebar {
        position: relative; height: auto; gap: 14px;
        border-right: 0; border-bottom: 1px solid var(--line);
      }
      .nav { flex-direction: row; flex-wrap: wrap; gap: 2px; }
      .nav button { width: auto; padding-left: 10px; }
      .nav button::before { display: none; }
      .nav button.active { box-shadow: inset 0 -2px 0 var(--accent); }
      .nav-label, .sidebar-foot { display: none; }
      .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric:nth-child(4) { border-left: 0; }
      .metric:nth-child(n + 4) { border-top: 1px solid var(--line); }
      .split, .two-col { grid-template-columns: 1fr; }
      .chrome { flex-wrap: wrap; align-items: flex-start; }
    }
    @media (max-width: 640px) {
      .metrics { grid-template-columns: 1fr 1fr; }
      .metric:nth-child(odd) { border-left: 0; }
      .metric:nth-child(n + 3) { border-top: 1px solid var(--line); }
      .main-body { padding: 12px 14px 22px; }
      .chrome { padding: 14px 14px 12px; }
      .log-line { grid-template-columns: 1fr; gap: 0; padding: 5px 12px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <strong>Nexora <em>Studio</em></strong>
        <span>Local Developer Center</span>
      </div>
      <nav class="nav" id="nav">
        <div class="nav-label">Inspect</div>
      </nav>
      <div class="sidebar-foot">
        <div class="sidebar-live">
          <div class="live-badge" id="liveBadgeSide" data-state="offline" title="Studio WebSocket">
            <span class="live-dot"></span>
            <span id="liveTextSide">Offline</span>
          </div>
        </div>
        <div id="sideMeta">
          <div class="foot-row"><span>api</span><span>waiting…</span></div>
        </div>
      </div>
    </aside>
    <main class="main">
      <div class="chrome">
        <div class="chrome-title">
          <h1 id="title">Overview</h1>
          <p id="subtitle">Live bot metrics from the Studio API.</p>
        </div>
        <div class="header-actions">
          <div class="badge" id="badge">
            <span class="dot" id="dot"></span>
            <span id="badgeText" class="phase">connecting…</span>
          </div>
          <div class="live-badge" id="liveBadge" data-state="offline" title="Studio WebSocket">
            <span class="live-dot"></span>
            <span id="liveText">Offline</span>
          </div>
          <button type="button" class="btn" id="refreshBtn" title="Refresh now">Refresh</button>
        </div>
      </div>
      <div class="main-body">
        <div id="error" class="error-banner" hidden></div>
        <div id="metrics" class="metrics" hidden></div>
        <div id="content" class="page-enter"></div>
      </div>
    </main>
  </div>
  <script>
    const TABS = [
      ['overview', 'Overview'],
      ['commands', 'Commands'],
      ['events', 'Events'],
      ['events-live', 'Events Live'],
      ['pipelines', 'Pipelines'],
      ['performance', 'Performance'],
      ['plugins', 'Plugins'],
      ['config', 'Configuration'],
      ['logs', 'Logs'],
      ['docs', 'Documentation'],
    ];
    /* Full Studio UI lives in apps/studio (Vite). Embedded mode keeps light stubs for Developer OS tabs. */
    const SUBTITLES = {
      overview: 'Live bot metrics from the Studio API.',
      commands: 'Registered slash, group, context, and message commands.',
      events: 'Discord event listeners attached to this process.',
      'events-live': 'Recent event handler traces (telemetry).',
      pipelines: 'Middleware pipeline traces per command execution.',
      performance: 'Memory and slow command / plugin aggregates.',
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
    let osCache = { eventsLive: null, pipelines: null, performance: null };

    const nav = document.getElementById('nav');
    for (const [id, label] of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<span>' + label + '</span><span class="count" data-count="' + id + '" hidden></span>';
      btn.dataset.id = id;
      btn.onclick = () => {
        tab = id;
        selectedCmd = null;
        const content = document.getElementById('content');
        content.classList.remove('page-enter');
        void content.offsetWidth;
        content.classList.add('page-enter');
        render();
      };
      nav.appendChild(btn);
    }

    document.getElementById('refreshBtn').onclick = () => refresh(true);

    function liveLabel(state) {
      return state === 'live' ? 'Live' : state === 'reconnecting' ? 'Reconnecting' : 'Offline';
    }

    function setLiveState(state) {
      liveState = state;
      for (const id of ['liveBadge', 'liveBadgeSide']) {
        const badge = document.getElementById(id);
        if (badge) badge.dataset.state = state;
      }
      for (const id of ['liveText', 'liveTextSide']) {
        const text = document.getElementById(id);
        if (text) text.textContent = liveLabel(state);
      }
    }

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function startPollingFallback() {
      if (pollTimer) return;
      pollTimer = setInterval(() => refresh(false), 2500);
    }

    function wsUrl() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      return proto + '//' + location.host + '/ws';
    }

    function applyState(nextSnapshot, nextLogs) {
      if (nextSnapshot) snapshot = nextSnapshot;
      if (nextLogs) logs = nextLogs;
      document.getElementById('error').hidden = true;
      render();
    }

    function connectWs() {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
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
          } else if (msg.type === 'studio:telemetry' && msg.payload) {
            osCache.eventsLive = { available: true, traces: msg.payload.eventTraces || [] };
            osCache.pipelines = { available: true, pipelines: msg.payload.pipelines || [] };
            if (msg.payload.performance) {
              osCache.performance = { available: true, ...msg.payload.performance };
            }
            if (tab === 'events-live' || tab === 'pipelines' || tab === 'performance') render();
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        ws = null;
        setLiveState('reconnecting');
        startPollingFallback();
        scheduleReconnect();
      };

      ws.onerror = () => {};
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

    function logTime(ts) {
      var d = new Date(ts);
      if (Number.isNaN(d.getTime())) {
        var m = String(ts ?? '').match(/(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)/);
        return m ? m[1] : String(ts ?? '');
      }
      function pad(n, w) { return String(n).padStart(w || 2, '0'); }
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
    }

    function displayLevel(entry) {
      return entry && entry.meta && entry.meta.type === 'command' ? 'cmd' : (entry && entry.level) || 'info';
    }

    function formatLogMeta(meta) {
      if (!meta) return '';
      var parts = [];
      if (typeof meta.user === 'string') parts.push(meta.user);
      if (typeof meta.name === 'string' && meta.type === 'command') parts.push('/' + meta.name);
      if (typeof meta.duration === 'number') parts.push(meta.duration + 'ms');
      else if (typeof meta.duration === 'string') parts.push(meta.duration);
      if (typeof meta.file === 'string') parts.push(meta.file);
      return parts.length ? ' · ' + parts.join(' · ') : '';
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
      const cls = t === 'slash' ? 'strong' : t === 'group' ? 'accent' : '';
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
        errEl.innerHTML = esc(e instanceof Error ? e.message : String(e)) +
          '<div class="muted" style="margin-top:6px">Start your bot with <code>createDevServer(bot)</code> (API on :3920). Studio UI: :3002.</div>';
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

    function renderMetrics() {
      const el = document.getElementById('metrics');
      if (!snapshot || tab === 'docs') {
        el.hidden = true;
        el.innerHTML = '';
        return;
      }
      const c = snapshot.meta?.counts || {};
      el.hidden = false;
      el.innerHTML =
        metric('Commands', c.commands ?? snapshot.commands.length, (c.slash != null ? c.slash + ' slash' : null)) +
        metric('Events', c.events ?? snapshot.events.length) +
        metric('Plugins', c.plugins ?? snapshot.plugins.length) +
        metric('Guilds', snapshot.bot.guilds) +
        metric('Uptime', formatUptime(snapshot.bot.uptimeMs));
    }

    function metric(label, value, sub) {
      return '<div class="metric"><h3>' + esc(label) + '</h3><div class="value">' +
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
        badge.className = 'tag';
        badge.textContent = snapshot.bot.tag || 'bot';
      } else if (snapshot) {
        badge.className = 'phase';
        badge.textContent = snapshot.bot.phase;
      } else {
        badge.className = 'phase';
        badge.textContent = 'connecting…';
      }

      if (snapshot?.meta?.ports) {
        document.getElementById('sideMeta').innerHTML =
          '<div class="foot-row"><span>api</span><span>:' + snapshot.meta.ports.api + '</span></div>' +
          '<div class="foot-row"><span>ui</span><span>:' + snapshot.meta.ports.studio + '</span></div>' +
          '<div class="foot-row"><span>version</span><span>v' + esc(snapshot.meta.apiVersion || '—') + '</span></div>';
      }

      updateNavCounts();
      renderMetrics();

      const el = document.getElementById('content');
      if (!snapshot && tab !== 'docs' && tab !== 'logs' && tab !== 'events-live' && tab !== 'pipelines' && tab !== 'performance') {
        el.innerHTML = '<p class="empty-note">Waiting for Studio API…</p>';
        return;
      }

      if (tab === 'overview') renderOverview(el);
      else if (tab === 'commands') renderCommands(el);
      else if (tab === 'events') renderEvents(el);
      else if (tab === 'events-live') void renderOsJson(el, 'events-live', '/api/studio/events/live');
      else if (tab === 'pipelines') void renderOsJson(el, 'pipelines', '/api/studio/pipelines');
      else if (tab === 'performance') void renderOsJson(el, 'performance', '/api/studio/performance');
      else if (tab === 'plugins') renderPlugins(el);
      else if (tab === 'config') renderConfig(el);
      else if (tab === 'logs') renderLogs(el);
      else if (tab === 'docs') renderDocs(el);
    }

    async function renderOsJson(el, cacheKey, path) {
      const titles = {
        'events-live': 'Event traces',
        pipelines: 'Pipeline traces',
        performance: 'Performance',
      };
      const cacheField = cacheKey === 'events-live' ? 'eventsLive' : cacheKey;
      el.innerHTML = panel(titles[cacheKey] || 'Data', '<p class="empty-note">Loading…</p>');
      try {
        const res = await fetch(path);
        const data = res.ok ? await res.json() : { error: 'HTTP ' + res.status };
        osCache[cacheField] = data;
        el.innerHTML = panel(
          titles[cacheKey] || 'Data',
          '<pre class="pre">' + esc(JSON.stringify(data, null, 2)) + '</pre>',
          false,
          data && data.available === false
            ? '<span class="pill warn">unavailable</span>'
            : '<span class="pill ok">live</span>',
        );
      } catch (e) {
        el.innerHTML = panel(
          titles[cacheKey] || 'Data',
          '<p class="empty-note err">' + esc(e instanceof Error ? e.message : String(e)) + '</p>',
        );
      }
    }

    function renderOverview(el) {
      const c = snapshot.meta?.counts || {};
      el.innerHTML =
        '<div class="two-col">' +
        panel('Bot status',
          '<ul class="list">' +
          row('Tag', esc(snapshot.bot.tag || '—')) +
          row('User ID', snapshot.bot.id ? '<code>' + esc(snapshot.bot.id) + '</code>' : '—') +
          row('Phase', esc(snapshot.bot.phase)) +
          row('Uptime', formatUptime(snapshot.bot.uptimeMs)) +
          row('Started', snapshot.bot.startedAt ? esc(new Date(snapshot.bot.startedAt).toLocaleString()) : '—') +
          row('Guilds', String(snapshot.bot.guilds)) +
          '</ul>',
          false,
          onlineBadge()) +
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
        '<div class="stack-gap">' +
        panel('Database',
          '<ul class="list">' +
          row('Provider', esc(snapshot.database.provider || '—')) +
          row('Status', snapshot.database.connected
            ? '<span class="ok">Connected</span>'
            : '<span class="warn">Not probed / offline</span>') +
          (snapshot.database.message
            ? row('Detail', '<span class="muted">' + esc(snapshot.database.message) + '</span>')
            : '') +
          '</ul>',
          false,
          snapshot.database.connected
            ? '<span class="pill ok">connected</span>'
            : '<span class="pill warn">offline</span>') +
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
          '<div class="panel-body filter-pad">' +
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
        opts = '<p class="empty-note inline">No options.</p>';
      }

      return '<div class="detail-title">/' + esc(c.name) + '</div>' +
        '<div class="detail-sub">' + esc(c.description || '') + '</div>' +
        '<div class="tag-row">' +
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
        '<div class="section-label">Options</div>' +
        opts;
    }

    function kv(k, v) {
      return '<div class="kv-row"><span>' + esc(k) + '</span><span>' + v + '</span></div>';
    }

    function renderEvents(el) {
      const events = snapshot.events || [];
      el.innerHTML = panel(
        'Registered events',
        events.length
          ? '<div class="panel-body tight">' + events.map((e) =>
              '<div class="evt-row"><div><div class="evt-name">' + esc(e.name) + '</div>' +
              (e.source ? '<div class="row-sub">' + esc(e.source) + '</div>' : '') +
              '</div><div class="cmd-meta">' +
              '<span class="pill ' + (e.once ? 'warn' : 'strong') + '">' + (e.once ? 'once' : 'on') + '</span>' +
              '</div></div>'
            ).join('') + '</div>'
          : '<p class="empty-note">No events registered.</p>',
        true,
        '<span class="muted">' + events.length + '</span>',
      );
    }

    function renderPlugins(el) {
      const plugins = snapshot.plugins || [];
      el.innerHTML = panel(
        'Installed plugins',
        plugins.length
          ? '<div class="panel-body tight">' + plugins.map((p) =>
              '<div class="plug-row"><div><div class="plug-name">' +
              '<span class="dot' + (p.enabled ? ' ok' : '') + '"></span>' +
              '<span>' + esc(p.name) + '</span> <span class="muted">v' + esc(p.version) + '</span></div>' +
              (p.description ? '<div class="row-sub">' + esc(p.description) + '</div>' : '') +
              '</div><div class="cmd-meta">' +
              '<span class="pill">' + p.commands + ' cmds</span>' +
              '<span class="pill">' + p.events + ' events</span>' +
              '<span class="pill ' + (p.enabled ? 'ok' : 'warn') + '">' + (p.enabled ? 'enabled' : 'disabled') + '</span>' +
              '</div></div>'
            ).join('') + '</div>'
          : '<p class="empty-note">No plugins loaded.</p>',
        true,
        '<span class="muted">' + plugins.length + '</span>',
      );
    }

    function renderConfig(el) {
      el.innerHTML = panel(
        'Active configuration',
        '<pre class="pre">' + esc(JSON.stringify(snapshot.config, null, 2)) + '</pre>',
        false,
        '<span class="muted">secrets redacted</span>',
      );
    }

    function renderLogs(el) {
      const lines = [...logs].reverse().map((l) => {
        const level = displayLevel(l);
        const mod = l.level === 'error' ? ' is-err' : l.level === 'warn' ? ' is-warn' : level === 'cmd' ? ' is-cmd' : '';
        const lvlCls = l.level === 'error' ? ' err' : l.level === 'warn' ? ' warn' : level === 'cmd' ? ' cmd' : '';
        const meta = formatLogMeta(l.meta);
        return '<div class="log-line' + mod + '">' +
          '<span class="ts" title="' + esc(l.timestamp) + '">' + esc(logTime(l.timestamp)) + '</span>' +
          '<span class="lvl' + lvlCls + '">' + esc(level) + '</span>' +
          '<span class="msg">' + esc((l.context ? '[' + l.context + '] ' : '') + l.message) +
          (meta ? '<span class="meta">' + esc(meta) + '</span>' : '') +
          '</span></div>';
      }).join('');
      el.innerHTML =
        '<div class="panel logs-panel">' +
        '<div class="panel-head"><h2>Live logs</h2><span class="muted">' + logs.length + ' buffered</span></div>' +
        '<div class="panel-body logs">' +
        (lines || '<p class="empty-note">Waiting for log events from <code>@nexora.ts/logger</code>…</p>') +
        '</div></div>';
    }

    function renderDocs(el) {
      el.innerHTML =
        '<div class="panel"><div class="docs-hero">' +
        '<h3>Nexora.js documentation</h3>' +
        '<p class="muted" style="margin:0 0 16px;max-width:46ch;font-size:13px">Studio is your local control panel. Framework guides, recipes, and API references live on GitBook. Full Developer OS UI: apps/studio (Vite).</p>' +
        '<p style="margin:0"><a class="docs-link" href="https://cjays-organization.gitbook.io/nexora.ts" target="_blank" rel="noreferrer">' +
        'cjays-organization.gitbook.io/nexora.ts →</a></p>' +
        '</div></div>' +
        '<div class="stack-gap">' +
        panel('Local ports',
          '<ul class="list">' +
          row('Nexora Studio', '<code>http://localhost:3002</code>') +
          row('Studio API', '<code>http://127.0.0.1:3920</code>') +
          '</ul>') +
        panel('Developer OS endpoints (api v0.3)',
          '<ul class="list">' +
          row('Events live', '<code>GET /api/studio/events/live</code>') +
          row('Pipelines', '<code>GET /api/studio/pipelines</code>') +
          row('Cmd metrics', '<code>GET /api/studio/commands/metrics</code>') +
          row('Performance', '<code>GET /api/studio/performance</code>') +
          row('Graph', '<code>GET /api/studio/graph</code>') +
          row('Deps health', '<code>GET /api/studio/health/deps</code>') +
          row('Config live', '<code>GET|PUT /api/studio/config/live</code>') +
          '</ul>') +
        '</div>';
    }

    function panel(title, body, tightBody, headExtra) {
      const extra = headExtra ? headExtra : '';
      if (tightBody) {
        return '<div class="panel"><div class="panel-head"><h2>' + title + '</h2>' + extra + '</div>' + body + '</div>';
      }
      return '<div class="panel"><div class="panel-head"><h2>' + title + '</h2>' + extra + '</div><div class="panel-body">' + body + '</div></div>';
    }
    function row(k, v) {
      return '<li><span>' + esc(k) + '</span><span>' + v + '</span></li>';
    }

    refresh();
    connectWs();
    startPollingFallback();
  </script>
</body>
</html>`;
}
