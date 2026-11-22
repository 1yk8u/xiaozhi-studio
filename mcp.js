/* 小智 AI · MCP Server
   角色：网页作为 MCP Server，小智 AI 平台作为 Client 连进来，
        调用网页暴露的工具（写代码、画图、分镜、时间等）。
   安全：token 只来自用户输入，仅存本机 localStorage，不进代码、不进仓库。 */

(function () {
  'use strict';

  const MCP_ENDPOINT = 'wss://api.xiaozhi.me/mcp/';
  const TOKEN_KEY = 'xz_mcp_token_v1';
  const AUTO_KEY = 'xz_mcp_autoconnect_v1';

  let ws = null;
  let connected = false;
  let reconnectTimer = null;
  let reconnectDelay = 2000;
  let callCount = 0;
  let failedAttempts = 0; // 连续连接失败次数，用于停止无限重连
  let handshakeTimer = null;

  // 网页暴露给小智 AI 的工具。description 写清楚，小智才知道何时调用。
  const TOOLS = [
    {
      name: 'write_code',
      description: '编写或修改代码。当用户要求写代码、做功能、实现程序、脚本、网页、修复 bug 时调用。返回完整可运行的代码。',
      inputSchema: {
        type: 'object',
        properties: {
          requirement: { type: 'string', description: '要实现的详细功能需求' },
          language: { type: 'string', description: '编程语言，如 Python、JavaScript、HTML、Java，不填则自动选择' },
        },
        required: ['requirement'],
      },
    },
    {
      name: 'generate_image',
      description: '根据文字描述生成 SVG 图片。当用户要求画图、生成图片、插画、配图时调用。返回 SVG 代码。',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: '画面描述，越具体越好' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'make_storyboard',
      description: '生成短视频分镜脚本。当用户要求写视频脚本、分镜、拍摄方案时调用。',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '视频主题或描述' },
        },
        required: ['topic'],
      },
    },
    {
      name: 'get_time',
      description: '获取当前的日期和时间。当用户问现在几点、今天日期时调用。',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  function token() {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  function log(msg, kind) {
    const box = document.getElementById('mcpLog');
    if (!box) return;
    const line = document.createElement('div');
    line.className = 'mcp-log-line' + (kind ? ' ' + kind : '');
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    line.textContent = `[${t}] ${msg}`;
    box.prepend(line);
    while (box.children.length > 40) box.removeChild(box.lastChild);
  }

  function setStatus(text, stateClass) {
    const dot = document.getElementById('mcpDot');
    const label = document.getElementById('mcpStatus');
    const mini = document.getElementById('mcpStatusMini');
    if (dot) dot.className = 'mcp-dot ' + (stateClass || '');
    if (label) label.textContent = text;
    if (mini) mini.textContent = text;
  }

  function updateButtons() {
    const conn = document.getElementById('mcpConnect');
    const disc = document.getElementById('mcpDisconnect');
    if (conn) conn.disabled = connected || !token();
    if (disc) disc.disabled = !connected;
  }

  // ---- MCP 协议处理 ----
  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function sendResult(id, result) {
    send({ jsonrpc: '2.0', id: id, result: result });
  }

  async function handleToolCall(id, params) {
    const name = params?.name;
    const args = params?.arguments || {};
    callCount++;
    log(`小智调用工具：${name}`, 'call');

    try {
      let text = '';
      const XZ = window.XZ || {};

      if (name === 'get_time') {
        text = '当前时间：' + new Date().toLocaleString('zh-CN');
      } else if (name === 'write_code') {
        const req = args.requirement || args.req || '';
        const lang = args.language || '自动选择';
        if (XZ.isCloudReady && XZ.isCloudReady()) {
          text = await XZ.ask(
            `请写代码完成这个需求：${req}。编程语言：${lang}。要求代码完整可运行，关键处写中文注释，并在代码后用一小段话说清思路和注意事项。`,
            XZ.systemPrompt
          );
        } else {
          text = `已收到写代码需求：${req}（${lang}）。但当前网页没有可用模型，无法生成真实代码。请去「设置 → 千帆 AI」填 key，或用云端版链接。`;
        }
      } else if (name === 'generate_image') {
        const prompt = args.prompt || '';
        if (XZ.isCloudReady && XZ.isCloudReady()) {
          text = await XZ.ask(
            `用纯 SVG 画一张插画：${prompt}。直接返回完整的 <svg>...</svg> 标签，不要 Markdown 代码块，不要解释文字。配色克制，结构清晰。`,
            XZ.systemPrompt
          );
        } else if (XZ.localSVG) {
          text = XZ.localSVG(prompt, '插画');
        } else {
          text = `已收到画图需求：${prompt}。当前无云端模型，仅返回占位说明。`;
        }
        // 顺便在本机渲染出来，用户能立刻看到
        renderLocalArt(text);
      } else if (name === 'make_storyboard') {
        const topic = args.topic || args.prompt || '';
        if (XZ.isCloudReady && XZ.isCloudReady()) {
          text = await XZ.ask(
            `写一个短视频分镜脚本：${topic}。按时间轴列出 5-7 个镜头，每个含时长、画面、运镜、旁白，最后给一句整体风格说明。用中文。`,
            XZ.systemPrompt
          );
        } else if (XZ.localStoryboard) {
          text = XZ.localStoryboard(topic);
        } else {
          text = `已收到视频脚本需求：${topic}。`;
        }
      } else {
        text = '未知工具：' + name;
      }

      sendResult(id, { content: [{ type: 'text', text: text }], isError: false });
      log(`工具 ${name} 已返回结果（${text.length} 字）`, 'ok');
      bumpToolCount();
    } catch (err) {
      const msg = err?.message || String(err);
      sendResult(id, { content: [{ type: 'text', text: '工具执行失败：' + msg }], isError: true });
      log(`工具 ${name} 失败：${msg}`, 'err');
    }
  }

  function handleMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const method = msg.method;

    // 握手：broker 作为 client 发 initialize
    if (method === 'initialize' && msg.id !== undefined) {
      const pv = msg.params?.protocolVersion || '2024-11-05';
      sendResult(msg.id, {
        protocolVersion: pv,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'xiaozhi-web-workbench', version: '1.0.0' },
      });
      log('MCP 握手完成', 'ok');
      return;
    }
    if (method === 'notifications/initialized') {
      connected = true;
      clearTimeout(handshakeTimer);
      failedAttempts = 0;
      updateButtons();
      setStatus('小智 AI 已连接', 'on');
      log('小智 AI 已就绪', 'ok');
      return;
    }
    if (method === 'tools/list' && msg.id !== undefined) {
      sendResult(msg.id, { tools: TOOLS });
      log(`已向小智注册 ${TOOLS.length} 个工具`, 'ok');
      return;
    }
    if (method === 'tools/call' && msg.id !== undefined) {
      handleToolCall(msg.id, msg.params);
      return;
    }
    if (method === 'ping' && msg.id !== undefined) {
      sendResult(msg.id, {});
      return;
    }
    if (method === 'notifications/cancelled') {
      log('小智取消了调用');
    }
  }

  function connect() {
    const tk = token();
    if (!tk) {
      if (window.XZ?.toast) window.XZ.toast('请先填入小智 MCP token');
      setStatus('未配置 token', '');
      return;
    }
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    setStatus('正在连接…', 'wait');
    log('正在连接小智 AI…');
    let opened = false;
    try {
      ws = new WebSocket(MCP_ENDPOINT + '?token=' + encodeURIComponent(tk));
    } catch (err) {
      setStatus('连接失败：' + (err.message || '地址错误'), 'err');
      log('WebSocket 创建失败：' + err.message, 'err');
      return;
    }

    // 握手超时：连上 12 秒还没收到 initialized，判定 token/端点无效
    clearTimeout(handshakeTimer);
    handshakeTimer = setTimeout(() => {
      if (!connected) {
        setStatus('连接超时：token 可能无效', 'err');
        log('握手超时：token 可能无效或端点不可用，停止自动重连', 'err');
        try { ws?.close(); } catch (e) {}
        localStorage.setItem(AUTO_KEY, '0'); // 停止重连，避免刷屏
        updateButtons();
      }
    }, 12000);

    ws.onopen = () => {
      opened = true;
      failedAttempts = 0;
      reconnectDelay = 2000;
      updateButtons();
      setStatus('握手中…', 'wait');
      log('WebSocket 已打开，等待小智握手');
    };
    ws.onmessage = (ev) => handleMessage(ev.data);
    ws.onerror = () => {
      if (!opened) {
        setStatus('连接失败：检查网络/token', 'err');
        log('连接出错：网络不通或 token 无效', 'err');
      }
    };
    ws.onclose = (ev) => {
      connected = false;
      clearTimeout(handshakeTimer);
      updateButtons();
      // 握手已成功过才叫"已连接"，否则是"连接失败"
      if (!opened) {
        failedAttempts++;
        setStatus('连接失败（' + (ev.code || '无响应') + '）', 'err');
        log('连接失败，code=' + (ev.code || '-') + '，连续失败 ' + failedAttempts + ' 次', 'err');
      } else {
        setStatus('已断开', '');
        log('连接已关闭（code ' + (ev.code || '-') + '）');
      }
      // 失败 3 次就停，避免无限重连刷屏
      if (failedAttempts >= 3) {
        log('连续失败 3 次，停止自动重连。请检查 token 后手动点连接。', 'err');
        localStorage.setItem(AUTO_KEY, '0');
        return;
      }
      if (localStorage.getItem(AUTO_KEY) !== '0' && token()) {
        log(`${reconnectDelay / 1000} 秒后重连…`);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    };
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    localStorage.setItem(AUTO_KEY, '0');
    if (ws) { ws.close(); ws = null; }
    connected = false;
    updateButtons();
    setStatus('未连接', '');
    log('已手动断开，停止自动重连');
  }

  function renderLocalArt(svgText) {
    const art = document.getElementById('mcpArt');
    if (!art) return;
    const m = String(svgText).match(/<svg[\s\S]*?<\/svg>/i);
    if (!m) return;
    const safe = m[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '').replace(/javascript:/gi, '');
    art.innerHTML = safe;
    art.style.display = 'block';
  }

  function bumpToolCount() {
    const el = document.getElementById('mcpCalls');
    if (el) el.textContent = '已响应 ' + callCount + ' 次调用';
  }

  // ---- 设置页交互绑定 ----
  function bindUI() {
    const save = document.getElementById('mcpSave');
    const conn = document.getElementById('mcpConnect');
    const disc = document.getElementById('mcpDisconnect');
    const input = document.getElementById('mcpToken');
    const toggle = document.getElementById('mcpToggle');

    if (input) {
      const saved = token();
      if (saved) input.value = saved;
      input.addEventListener('input', () => { if (conn) conn.disabled = !input.value.trim() || connected; });
    }
    if (toggle) {
      toggle.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }
    if (save) {
      save.addEventListener('click', () => {
        const v = (input.value || '').trim();
        if (!v) { if (window.XZ?.toast) window.XZ.toast('先填入 token'); return; }
        localStorage.setItem(TOKEN_KEY, v);
        localStorage.setItem(AUTO_KEY, '1');
        input.value = v;
        updateButtons();
        if (window.XZ?.toast) window.XZ.toast('token 已存到本机浏览器，不会上传');
        log('token 已保存到本机');
      });
    }
    if (conn) conn.addEventListener('click', () => {
      const v = (input.value || '').trim();
      if (v && v !== token()) { localStorage.setItem(TOKEN_KEY, v); localStorage.setItem(AUTO_KEY, '1'); }
      connect();
    });
    if (disc) disc.addEventListener('click', disconnect);

    updateButtons();
  }

  function init() {
    bindUI();
    // 工具清单渲染
    const box = document.getElementById('mcpTools');
    if (box) {
      box.innerHTML = TOOLS.map((t) =>
        `<div class="mcp-tool"><strong>${t.name}</strong><span>${t.description.split('。')[0]}</span></div>`
      ).join('');
    }
    // 有 token 且上次允许自动连接则自动连
    if (token() && localStorage.getItem(AUTO_KEY) !== '0') {
      setTimeout(connect, 600);
    } else {
      setStatus('未连接', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
