/* 小智工作台 — 交互与云端能力
   职责划分：本文件只管「怎么把事做完」，视觉交给 styles.css。 */

/* ---------- 云端配置（来自本应用的 publicConfig，可公开） ---------- */
const CLOUD_CONFIG = {
  endpoint: 'https://xiaozhi-studio-61540.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_c6dus6czDzRDAR6O1Ys0OQ_Qc4VEii7R7vuoHqgmDL8bvP2azuJsWl8',
};

const SYSTEM_PROMPT = `你是小智，一个干了多年开发、说话直接的工程师搭档。
交流方式像同事，不像客服：先给结论，再补必要的理由；不用「很高兴为您服务」「请问还有什么可以帮您」这类客套，不堆形容词，不写空泛的总结段。
写代码时给能直接跑、能维护的版本，讲清楚关键取舍和容易踩的坑；不要为了炫技写过度抽象的设计。
不确定的事直接说不知道或需要验证，绝不编造 API、版本号或事实。
用户懂技术，不必解释基础概念。回答用中文，代码注释用中文。
默认用户要的是能落地的结果，不是一段漂亮的说明文。`;

/* ---------- 静态数据 ---------- */
const SKILLS = [
  { name: '旅游计划', desc: '基于真实信息规划行程，给出可执行的安排', emoji: '✈️', bg: '#e8f3ff', fav: 1, prompt: '帮我做一个旅游计划。先问我目的地、天数和预算，再给每日行程、交通和避坑提示。' },
  { name: '性格测试', desc: '趣味测试，认真解读结果', emoji: '✨', bg: '#fff4e5', prompt: '给我出一个有趣的性格测试，10 道题以内，答完给解读。' },
  { name: '饮食助手', desc: '拍一张，帮你分析热量和搭配', emoji: '🥗', bg: '#eaf8e9', prompt: '我想改善饮食，帮我做一份一周午餐搭配，说明大致热量和营养重点。' },
  { name: '对比解读', desc: '把链接或两段内容摆在一起看差别', emoji: '📊', bg: '#ece9ff', fav: 1, prompt: '我给你两段内容，帮我做一份逐项对比，指出关键差异和各自适用场景。' },
  { name: '图片创作', desc: '用描述生成一张矢量插画', emoji: '🎨', bg: '#e9f4ff', prompt: '画一张图：' },
  { name: '个人计划', desc: '把目标拆成每天能做的事', emoji: '👥', bg: '#eaf2ff', prompt: '帮我把一个目标拆成可执行的周计划，标注优先级和验收标准。' },
  { name: 'PPT 制作', desc: '把主题材料做成可编辑大纲', emoji: '📙', bg: '#fff3e2', fav: 1, prompt: '帮我把主题做成 PPT 逐页大纲，每页给标题、要点和备注。' },
  { name: 'Excel 表格', desc: '整理计算分析数据，生成表格', emoji: '📗', bg: '#e8f8ec', prompt: '帮我设计一张表格结构，包含字段、公式和数据校验思路。' },
  { name: 'PDF 处理', desc: '新建、读取和处理 PDF 文档', emoji: '📕', bg: '#ffeded', prompt: '帮我梳理一份 PDF 文档的结构，并给出处理思路。' },
  { name: 'Word 文档', desc: '改写排版，支持修订批注', emoji: '📘', bg: '#e9f1ff', prompt: '帮我改写这段文字，保持原意，让表达更清楚、更简洁。' },
  { name: '专业教案写作', desc: '按课标写出可直接用的教案', emoji: '📝', bg: '#eef4ff', prompt: '帮我写一份教案，包含教学目标、重难点、过程和板书设计。' },
  { name: '科研问题构思', desc: '从选题到方法帮你理思路', emoji: '💡', bg: '#fff6dc', prompt: '帮我梳理一个研究选题：背景、问题、方法和可能的创新点。' },
  { name: '作业批改', desc: '逐题分析，指出错因', emoji: '✅', bg: '#e9f8ef', prompt: '我发一份作业给你，请逐题批改并指出错因。' },
  { name: 'AI 生视频', desc: '写分镜脚本和运镜说明', emoji: '🎬', bg: '#f0eaff', prompt: '为我写一个视频分镜：' },
  { name: '深度研究', desc: '拆问题、找资料、给结论', emoji: '🔍', bg: '#e9f2ff', prompt: '帮我深入研究一个问题，列出关键事实、不同观点和你的判断依据。' },
  { name: '金融理财', desc: '梳理账目和收支结构', emoji: '💰', bg: '#fdf4e4', prompt: '帮我分析收支结构，给出可执行的整理建议。' },
  { name: '数据分析', desc: '从数据里找出真正有用的结论', emoji: '📈', bg: '#e8f7f6', prompt: '我给你一组数据，帮我找出趋势、异常和值得追问的点。' },
  { name: '腾讯文档', desc: '创建、编辑和整理在线文档', emoji: '📄', bg: '#e8f1ff', prompt: '帮我起草一份文档，说明结构和每部分要写什么。' },
  { name: '携程', desc: '查询机票火车票酒店和景点', emoji: '🧳', bg: '#e6f4ff', prompt: '帮我列出一次出行需要查的票务和住宿信息，以及查询顺序。' },
  { name: '航班管家', desc: '查询预订机票和行程变动', emoji: '✈️', bg: '#eaf0ff', prompt: '帮我整理一段航班行程的关键信息和变动应对方案。' },
];

const TOOLS = [
  { id: 'gen', name: '代码生成', desc: '按需求写出能跑的实现', icon: 'i-code', bg: '#e8f1ff', color: '#2f6fd0', template: '用 {{语言}} 写一段代码：{{需求}}。要求可直接运行，关键处写中文注释，并说明取舍。' },
  { id: 'review', name: '代码审查', desc: '挑出 bug 和隐患', icon: 'i-search', bg: '#fff0ec', color: '#d9603f', template: '审查下面这段代码，按严重程度列出问题、原因和改法：\n\n{{粘贴代码}}' },
  { id: 'explain', name: '代码解释', desc: '讲清楚一段代码在干嘛', icon: 'i-book', bg: '#f0eaff', color: '#7a52cc', template: '用工程师的语言解释这段代码：结构、执行流程和关键细节。\n\n{{粘贴代码}}' },
  { id: 'fix', name: 'Bug 修复', desc: '定位问题并给补丁', icon: 'i-task', bg: '#ffeded', color: '#cc4b4b', template: '这段代码有 bug，现象是：{{现象}}。请定位原因并给出修改后的代码：\n\n{{粘贴代码}}' },
  { id: 'refactor', name: '重构优化', desc: '让代码更清楚更快', icon: 'i-toolbox', bg: '#e9f7ef', color: '#1e9a5a', template: '重构下面这段代码，目标是：{{目标}}。保留原有行为，说明每处改动的原因：\n\n{{粘贴代码}}' },
  { id: 'translate', name: '语言转换', desc: '在语言之间等价改写', icon: 'i-share', bg: '#eef2ff', color: '#4a63c8', template: '把下面的 {{源语言}} 代码改写成 {{目标语言}}，保持行为一致，并指出两种语言的差异：\n\n{{粘贴代码}}' },
  { id: 'comment', name: '添加注释', desc: '补上真正有用的注释', icon: 'i-text', bg: '#fff6e3', color: '#c08a24', template: '给下面这段代码补注释。只解释「为什么」，不要逐行翻译代码：\n\n{{粘贴代码}}' },
  { id: 'test', name: '写测试用例', desc: '覆盖正常和边界情况', icon: 'i-check', bg: '#e8f8f7', color: '#14988f', template: '为下面的代码写测试用例，覆盖正常、边界和异常情况，并说明断言理由：\n\n{{粘贴代码}}' },
  { id: 'sql', name: 'SQL 生成', desc: '写查询和优化索引', icon: 'i-folder', bg: '#f2edff', color: '#6e4bbd', template: '根据需求写 SQL：{{需求}}。表结构我会在下面给出，同时建议需要的索引：\n\n{{表结构}}' },
  { id: 'regex', name: '正则生成', desc: '写正则并逐段解释', icon: 'i-code', bg: '#eaf0ff', color: '#3d63b5', template: '写一个匹配 {{要匹配的内容}} 的正则表达式，逐段解释，并给 3 个正例和 3 个反例。' },
  { id: 'ui', name: '界面还原', desc: '把描述变成可预览页面', icon: 'i-image', bg: '#ffeff4', color: '#c54470', template: '写一个单文件 HTML 页面，实现：{{界面需求}}。要求响应式、无外部依赖、代码整洁。' },
  { id: 'svg', name: '矢量插图', desc: '用代码画出一张图', icon: 'i-spark', bg: '#fff4e6', color: '#c47a20', template: '用纯 SVG 画一张插画：{{画面描述}}。要求结构清晰、配色克制，直接返回 <svg> 标签，不要 Markdown 包裹。' },
  // 语言与平台：Android / Python / 前端 / 后端等
  { id: 'android-sdk', name: 'Android SDK', desc: '安卓组件与 API 用法', icon: 'i-code', bg: '#eaf6e9', color: '#2e8b3d', template: '用 Android SDK 实现：{{功能需求}}。用 Kotlin 优先，给出关键类、API 调用和必要的权限配置，关键处写中文注释，并指出常见坑。' },
  { id: 'android-studio', name: 'Android Studio', desc: '建项目、Gradle、调试', icon: 'i-toolbox', bg: '#e8f0ff', color: '#3568c4', template: '在 Android Studio 里帮我完成：{{任务}}。给出具体步骤、Gradle 配置和需要的文件路径，说明原理和验证方法。' },
  { id: 'android-ui', name: '安卓界面', desc: 'Compose / XML 布局', icon: 'i-palette', bg: '#f3ebff', color: '#7a52cc', template: '用 Android {{Compose 或 XML}} 写一个界面：{{界面需求}}。给出完整布局代码、尺寸与主题处理，并说明适配要点。' },
  { id: 'python', name: 'Python', desc: '脚本/数据处理/自动化', icon: 'i-code', bg: '#eef2ff', color: '#3f5fc4', template: '用 Python 实现：{{需求}}。给出可直接运行的代码，关键处写中文注释，并说明依赖和运行方式。' },
  { id: 'python-data', name: 'Python 数据分析', desc: 'pandas / 可视化', icon: 'i-folder', bg: '#e9f7f6', color: '#14988f', template: '用 Python（pandas/matplotlib）分析：{{分析需求}}。给出数据清洗、分析和可视化的完整代码，并解释结论怎么看。' },
  { id: 'frontend', name: '前端页面', desc: 'HTML / CSS / JS', icon: 'i-image', bg: '#fff0ec', color: '#d9603f', template: '用原生 HTML/CSS/JS 实现：{{页面需求}}。要求响应式、代码整洁、无外部依赖，给出完整单文件代码。' },
  { id: 'react', name: 'React 组件', desc: '可复用组件与状态', icon: 'i-spark', bg: '#e8f1ff', color: '#2f6fd0', template: '写一个 React 组件实现：{{功能}}。用函数组件和 Hooks，给出完整代码、props 定义和使用示例。' },
  { id: 'backend', name: '后端接口', desc: 'API / 数据库设计', icon: 'i-shield', bg: '#e9f7ef', color: '#1e9a5a', template: '设计一个后端接口实现：{{功能需求}}。给出路由、请求响应结构、数据库表设计和必要的校验，技术栈用 {{技术栈}}。' },
];

/* 声音不再写死：直接用设备上真实安装的语音引擎，有多少列多少 */
function getSystemVoices() {
  try {
    const all = window.speechSynthesis?.getVoices() || [];
    const hidden = store.hiddenVoices || [];
    return all.filter((v) => !hidden.includes(v.voiceURI) && !hidden.includes(v.name));
  } catch (e) { return []; }
}
// 语言分组的固定顺序：中文永远排最前，English 放后面
const VOICE_GROUP_ORDER = ['中文', '粤语', '英文', '日语', '韩语', '其他语言'];
// iOS 上 speechSynthesis 不宜延迟调用（会脱离用户手势）；Chrome 需要延迟避开 cancel 吞音
const UA = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
const IS_IOS = /iPhone|iPad|iPod/i.test(UA);
function laterSpeak(fn, ms) { if (IS_IOS) fn(); else setTimeout(fn, ms || 140); }
function voiceGroup(lang) {
  const l = (lang || '').toLowerCase();
  if (l.startsWith('yue') || (l.startsWith('zh') && l.includes('hk'))) return '粤语';
  if (l.startsWith('zh')) return '中文';
  if (l.startsWith('en')) return '英文';
  if (l.startsWith('ja')) return '日语';
  if (l.startsWith('ko')) return '韩语';
  return '其他语言';
}
function getSelectedVoice() {
  const list = getSystemVoices();
  if (!list.length) return null;
  const exact = list.find((v) => v.voiceURI === store.voice || v.name === store.voice);
  if (exact) return exact;
  // 默认挑一个中文声音（优先本地），不再落到英文上
  const zh = list.filter((v) => (v.lang || '').toLowerCase().startsWith('zh'));
  return (zh.find((v) => v.localService) || zh[0]) || list.find((v) => v.default) || list[0];
}

const PROMPTS = [
  '帮我写一个小工具，把文件夹里的图片按日期重命名',
  '解释一下这段 React 代码为什么会重复渲染',
  '画一张雨夜便利店的矢量插画',
  '给我一份三天两晚的行程，预算 2000',
];

const THEMES = [
  { name: '默认', color: '#07b857', ink: '#07b857', soft: '#e8f8ee' },
  { name: '墨蓝', color: '#3d6fd0', ink: '#3d6fd0', soft: '#eaf0fd' },
  { name: '暖橙', color: '#d9822b', ink: '#c47726', soft: '#fff1e2' },
  { name: '灰阶', color: '#5c5c63', ink: '#42424a', soft: '#ededf0' },
];

/* ---------- 状态 ---------- */
const STORE_KEY = 'xiaozhi-studio-v1';
const defaults = {
  voice: '', speechRate: 1, speechPitch: 1, autoRead: true, theme: '默认', memoryOn: true,
  hiddenVoices: [],
  history: [], tasks: [], memories: [], assets: [], favs: ['旅游计划', '对比解读', 'PPT 制作'],
};
let store = { ...defaults };
try { Object.assign(store, JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); } catch (e) { /* 用默认值 */ }
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 隐私模式下忽略 */ }
}

const state = {
  view: 'chat',
  currentChat: null,
  models: [],
  model: null,
  busy: false,
  controller: null,
  lastRequestAt: 0,
  skillTab: 'all',
  skillQuery: '',
  taskTab: 'doing',
  createType: 'image',
  recognition: null,
  cloudReady: false,
  qianfanReady: !!window.QIANFAN?.getKey?.(),
};

/* ---------- 统一模型通道：云端 SDK 或千帆 ---------- */
function currentSource() { return state.model?.source === 'qianfan' ? 'qianfan' : 'cloud'; }

// 统一流式接口：产出纯文本增量，屏蔽底层差异
async function* streamChat(messages, signal) {
  const src = currentSource();
  if (src === 'qianfan') {
    if (!window.QIANFAN) throw new Error('千帆脚本还没加载，刷新页面重试');
    for await (const text of window.QIANFAN.chatStream(messages, state.model.id, signal)) {
      yield text;
    }
    return;
  }
  if (!state.cloudReady) throw new Error('云端还没连上，刷新页面重试');
  for await (const chunk of cloud.llm.chat.completions.create({
    model: state.model.id,
    messages,
    stream: true,
    temperature: 0.7,
    stream_options: { include_usage: true },
    signal,
  })) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) yield delta.content;
    if (delta?.refusal) yield `\n\n${delta.refusal}`;
  }
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const now = () => new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

let toastTimer;
function toast(msg) {
  const el = byId('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- 云端客户端 ---------- */
let cloud = null;
function initCloud() {
  if (!window.WorkBuddyCloud) {
    byId('modelCurrent').textContent = '云端脚本没加载出来，检查网络后刷新页面。';
    return;
  }
  try {
    cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: CLOUD_CONFIG.endpoint,
      oauthRelayBaseUrl: CLOUD_CONFIG.oauthRelayBaseUrl,
      publishableKey: CLOUD_CONFIG.publishableKey,
    });
    state.cloudReady = true;
    loadModels();
  } catch (err) {
    byId('modelCurrent').textContent = '云端初始化失败：' + (err?.message || '未知错误');
  }
}

function qianfanModels() {
  if (!window.QIANFAN?.getKey?.()) return [];
  return window.QIANFAN.models().map((m) => ({
    id: m.id,
    name: m.name,
    description: m.note,
    source: 'qianfan',
    free: m.free,
  }));
}

function assembleModels(cloudModels = []) {
  const normalized = cloudModels.filter((m) => m.disabled !== true).map((m) => ({
    id: m.id, name: m.name || m.id, description: m.description || '云端模型', source: 'cloud',
  }));
  const qf = qianfanModels();
  // 去重：同 id 以千帆为准（明确标 source）
  const seen = new Set(normalized.map((m) => m.id));
  const merged = [...normalized, ...qf.filter((m) => !seen.has(m.id))];
  state.models = merged;
  if (!merged.length) return false;
  const savedId = store.modelId;
  state.model = merged.find((m) => m.id === savedId) || merged[0];
  return true;
}

async function loadModels() {
  byId('modelCurrent').textContent = '正在获取可用模型…';
  let cloudModels = [];
  if (state.cloudReady) {
    try {
      cloudModels = await cloud.llm.models.list();
    } catch (err) {
      // 云端拉取失败不致命，千帆模型照样可用
    }
  }
  // 千帆 key 一填就能进列表，即使云端完全没连上
  if (assembleModels(cloudModels)) {
    const qfCount = state.models.filter((m) => m.source === 'qianfan').length;
    const parts = [];
    if (state.cloudReady) parts.push(`${cloudModels.length} 个云端模型`);
    if (qfCount) parts.push(`${qfCount} 个千帆模型`);
    byId('modelCurrent').textContent = parts.length
      ? `可选：${parts.join(' + ')}`
      : '当前没有可用模型，去设置里填千帆 key 或刷新。';
    renderModelOptions();
    updateSideContext();
  } else {
    byId('modelCurrent').textContent = '没有可用模型：去「设置 → 千帆 AI」填 key，或用云端版链接。';
  }
}

function renderModelOptions() {
  const box = byId('modelOptions');
  box.innerHTML = '';
  state.models.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'model-option' + (state.model?.id === m.id ? ' selected' : '');
    const name = m.name || m.id;
    const desc = m.description || ['快答：日常问题，响应更快', '深度：复杂推理，想得更透', '专家：适合多步任务'][Math.min(i, 2)];
    const tag = m.source === 'qianfan'
      ? `<span class="mo-tag ${m.free ? 'free' : ''}">${m.free ? '免费' : '千帆'}</span>`
      : '';
    btn.innerHTML = `<span class="mo-main"><strong>${esc(name)} ${tag}</strong><small>${esc(desc)}</small></span><svg class="icon check"><use href="#i-check"/></svg>`;
    btn.onclick = () => {
      state.model = m;
      store.modelId = m.id;
      persist();
      renderModelOptions();
      updateSideContext();
      closeSheets();
      toast(`已切到 ${name}`);
    };
    box.appendChild(btn);
  });
}

function friendlyError(err) {
  const code = err?.error?.code || '';
  if (code.startsWith('auth_')) return '当前域名没被授权调用云端模型，请用云端版链接打开，或在 GitHub 版填入自己的 API。';
  if (code.startsWith('quota_')) return '云端额度用完了或有频率限制，等一会儿再试。';
  if (code.startsWith('request_')) return '请求参数有问题，换个模型再试。';
  if (code.startsWith('gateway_') || code.startsWith('model_')) return '模型服务暂时不可用，点重试再来一次。';
  return err?.error?.message || err?.message || '出了点问题，再试一次。';
}

/* ---------- Markdown / 代码渲染 ---------- */
const KEYWORDS = /\b(?:const|let|var|function|return|if|else|for|while|class|new|import|export|from|def|async|await|public|private|int|str|bool|None|True|False|try|catch|throw|switch|case|break|continue|interface|type|enum)\b/;
function highlight(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|class|new|import|export|from|def|async|await|public|private|int|str|bool|None|True|False|try|catch|throw|switch|case|break|continue|interface|type|enum)\b)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(code)) !== null) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'num' : 'key';
    out += `<span class="token-${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

function renderText(raw) {
  const parts = String(raw).split(/```([\w-]*)\n([\s\S]*?)```/g);
  let html = '';
  for (let i = 0; i < parts.length; i += 3) {
    let text = esc(parts[i])
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>');
    html += text.replace(/\n/g, '<br>');
    if (i + 2 < parts.length) {
      const lang = esc(parts[i + 1] || 'code');
      const code = parts[i + 2].replace(/\n$/, '');
      html += `<div class="msg-code"><div class="code-head"><span>${lang}</span><button data-action="copy-code"><svg class="icon"><use href="#i-copy"/></svg>复制</button></div><pre>${highlight(code)}</pre></div>`;
    }
  }
  return html;
}

/* ---------- 视图与抽屉 ---------- */
function goto(view) {
  if (view === 'chat-with-text') {
    goto('chat');
    byId('input').focus();
    return;
  }
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  state.view = view;
  closeDrawer();
  window.scrollTo(0, 0);
}

function openDrawer() { byId('drawer').classList.add('open'); byId('drawerScrim').classList.add('show'); }
function closeDrawer() { byId('drawer').classList.remove('open'); byId('drawerScrim').classList.remove('show'); }
function openSheet(id) { byId(id).classList.add('open'); }
function closeSheets() { $$('.sheet').forEach((s) => s.classList.remove('open')); }

document.addEventListener('click', (e) => {
  const gotoEl = e.target.closest('[data-goto]');
  if (gotoEl) { goto(gotoEl.dataset.goto); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  const handlers = {
    drawer: openDrawer,
    'close-sheet': closeSheets,
    'new-chat': newChat,
    'close-side': () => byId('sidePanel').style.display = 'none',
    'read-last': readLast,
    send: () => sendMessage(),
    camera: () => toast('相机权限需要 HTTPS 环境，本地预览可先直接输入文字'),
    attach: () => toast('直接把要做的告诉小智，写代码、出图都能在对话里完成'),
    'voice-input': toggleVoiceInput,
    'pick-mode': () => openSheet('modelSheet'),
    'voice-person': () => goto('voices'),
    'toggle-camera': toggleCamera,
    'toggle-mic': toggleMic,
    theme: cycleTheme,
    notice: () => toast('消息通知保持关闭，不被打扰'),
    privacy: () => toast('对话只存在这台设备上，不上传第三方'),
    about: () => toast('小智工作台 v1.0 · 用代码说话'),
    'toggle-memory': toggleMemory,
    'add-task': addTask,
    'add-group': () => toast('分组功能先留空，需要再加'),
    'sort-history': () => toast('已按最近使用排序'),
    'sort-skills': () => toast('技能按使用频率排列'),
    'tool-search': () => byId('toolGrid').scrollIntoView(),
    'copy-code': (el) => copyText(el.closest('.msg-code').querySelector('pre').innerText),
  };
  if (handlers[action]) handlers[action](e.target.closest('[data-action]'));
});

/* ---------- 聊天 ---------- */
function newChat() {
  state.currentChat = null;
  const box = byId('messages');
  box.innerHTML = '';
  box.appendChild(buildWelcome());
  renderWelcomePrompts();
  closeDrawer();
  goto('chat');
  updateSideContext();
}

function buildWelcome() {
  const wrap = document.createElement('div');
  wrap.className = 'msg ai';
  wrap.innerHTML = `<div class="msg-body"><div class="welcome-card">
    <div class="welcome-emoji">👋</div>
    <div class="welcome-title">Hi，我是小智</div>
    <p class="welcome-desc">写代码、查资料、出图剪片都能搭把手。<br>你想从哪件事开始？</p>
    <div class="welcome-prompts" id="welcomePrompts"></div>
  </div></div>`;
  return wrap;
}

function renderWelcomePrompts() {
  const box = byId('welcomePrompts');
  if (!box) return;
  box.innerHTML = '';
  PROMPTS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'prompt-chip';
    b.textContent = p;
    b.onclick = () => { setInput(p); sendMessage(); };
    box.appendChild(b);
  });
}

function setInput(text) { byId('input').innerText = text; byId('input').focus(); syncSendBtn(); }

function appendMsg(role, text = '', opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const body = document.createElement('div');
  body.className = 'msg-body';
  if (opts.processed) body.innerHTML += '<div class="processed">已处理 ›</div>';
  const content = document.createElement('div');
  content.className = 'msg-text';
  content.innerHTML = text ? renderText(text) : '';
  body.appendChild(content);
  if (role === 'ai' && opts.actions !== false) {
    const acts = document.createElement('div');
    acts.className = 'msg-actions';
    acts.innerHTML = [
      ['i-redo', '重新生成', 'retry'], ['i-copy', '复制', 'copy'],
      ['i-thumb-up', '赞', 'up'], ['i-thumb-down', '踩', 'down'],
      ['i-volume', '朗读', 'speak'], ['i-share', '分享', 'share'],
    ].map(([icon, label, key]) => `<button data-msg-act="${key}" title="${label}" aria-label="${label}"><svg class="icon"><use href="#${icon}"/></svg></button>`).join('');
    body.appendChild(acts);
  }
  wrap.appendChild(body);
  byId('messages').appendChild(wrap);
  scrollToBottom();
  return { wrap, content, acts: body.querySelector('.msg-actions') };
}

function scrollToBottom() { const m = byId('messages'); m.scrollTop = m.scrollHeight; }

async function sendMessage(override) {
  if (state.busy) { toast('等这条回完再说'); return; }
  if (Date.now() - state.lastRequestAt < 1200) { toast('慢一点，防止额度被一次用完'); return; }
  const input = byId('input');
  const text = (override || input.innerText).trim();
  if (!text) return;
  input.innerText = '';
  syncSendBtn();
  state.lastRequestAt = Date.now();

  if (!state.currentChat) {
    state.currentChat = { id: uid(), context: [], title: text.slice(0, 22), at: now() };
    store.history.unshift(state.currentChat);
    store.history = store.history.slice(0, 30);
    persist();
    renderHistory();
  }
  appendMsg('user', text);
  const reply = appendMsg('ai', '', { processed: true, actions: false });
  const thinking = document.createElement('span');
  thinking.style.color = 'var(--ink-3)';
  thinking.textContent = '小智正在想…';
  reply.content.appendChild(thinking);

  if (!state.model) {
    thinking.textContent = '没有可用模型。去「设置 → 千帆 AI」填入 key，或刷新页面重试。';
    return;
  }

  state.busy = true;
  state.controller = new AbortController();
  let full = '';
  stopSpeech(); // 新一轮对话，清掉上一次的朗读队列
  const ctx = state.currentChat.context.slice(-12);
  const messages = [
    { role: 'system', content: store.memoryOn && store.memories.length
      ? `${SYSTEM_PROMPT}\n\n你记住的关于用户的偏好：${store.memories.map((m) => m.text).join('；')}`
      : SYSTEM_PROMPT },
    ...ctx,
    { role: 'user', content: text },
  ];

  try {
    thinking.remove();
    for await (const text of streamChat(messages, state.controller.signal)) {
      full += text;
      reply.content.innerHTML = renderText(full);
      scrollToBottom();
      feedSpeechWhileTyping(full); // 文字蹦的同时，把完整句送去朗读
    }
    if (!full) {
      reply.content.innerHTML = '<span style="color:var(--ink-3)">这次没有返回内容，点重新生成试试。</span>';
    } else {
      reply.content.innerHTML = renderText(full);
      // 生成结束：把末尾不足一句的剩余文字补念
      if (store.autoRead && window.speechSynthesis) {
        const clean = cleanForSpeech(full);
        const tail = clean.slice(speechQ.spokenTo).trim();
        if (tail) speechQ.queue.push(tail);
        flushSpeechQueue();
      }
      restoreActions(reply, full);
      state.currentChat.context.push({ role: 'user', content: text }, { role: 'assistant', content: full });
      state.currentChat.context = state.currentChat.context.slice(-20);
      state.currentChat.title = state.currentChat.context.length <= 2 ? text.slice(0, 22) : state.currentChat.title;
      persist();
      updateSideContext();
      recordAsset('对话', full.slice(0, 80).replace(/\n/g, ' '));
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      reply.content.innerHTML = renderText(full) + '<br><span style="color:var(--ink-3)">已停止生成。</span>';
      stopSpeech();
      if (full) restoreActions(reply, full);
    } else {
      const msg = friendlyError(err);
      reply.content.innerHTML = renderText(full) + (full ? '<br><br>' : '') + `<span style="color:#c04747">${esc(msg)}</span>`;
      const retry = document.createElement('button');
      retry.className = 'tag';
      retry.style.marginTop = '10px';
      retry.textContent = '重试';
      retry.onclick = () => { reply.wrap.remove(); sendMessage(text); };
      reply.content.appendChild(retry);
    }
  } finally {
    state.busy = false;
    state.controller = null;
    syncSendBtn();
    scrollToBottom();
  }
}

function restoreActions(reply, text) {
  if (reply.acts) return;
  const body = reply.wrap.querySelector('.msg-body');
  const acts = document.createElement('div');
  acts.className = 'msg-actions';
  acts.innerHTML = [
    ['i-redo', '重新生成', 'retry'], ['i-copy', '复制', 'copy'],
    ['i-thumb-up', '赞', 'up'], ['i-thumb-down', '踩', 'down'],
    ['i-volume', '朗读', 'speak'], ['i-share', '分享', 'share'],
  ].map(([icon, label, key]) => `<button data-msg-act="${key}" title="${label}" aria-label="${label}"><svg class="icon"><use href="#${icon}"/></svg></button>`).join('');
  body.appendChild(acts);
  reply.acts = acts;
  reply.content.dataset.full = text;
}

byId('messages').addEventListener('click', (e) => {
  const key = e.target.closest('[data-msg-act]')?.dataset.msgAct;
  if (!key) return;
  const msg = e.target.closest('.msg');
  const text = msg.querySelector('.msg-text')?.innerText || '';
  if (key === 'copy') copyText(text);
  if (key === 'speak') speak(text);
  if (key === 'retry') { msg.remove(); sendMessage(state.currentChat?.context.slice(-2)[0]?.content || text); }
  if (key === 'up') toast('收到，记下了');
  if (key === 'down') toast('抱歉，下次改进');
  if (key === 'share') copyText(text).then(() => toast('内容已复制，可以粘贴分享'));
});

const sendBtn = byId('sendBtn');
function syncSendBtn() {
  if (!sendBtn) return;
  const has = !!(byId('input').innerText || '').trim();
  sendBtn.disabled = !has || state.busy;
}
byId('input').addEventListener('input', syncSendBtn);
byId('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('已复制'); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); toast('已复制');
  }
}

/* ---------- 朗读 / 多声音 ---------- */
/* 朗读队列：文字一边蹦，声音一边按完整句接上去念，不打断、不从头重念 */
const speechQ = { queue: [], speaking: false, genText: '', spokenTo: 0 };

function cleanForSpeech(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, '（代码略）')
    .replace(/[#*`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
}
// 把一个完整句切成可朗读的片段（按中文/英文句末标点）
function splitSentences(text) {
  return text.split(/(?<=[。！？!?；;\n])/).map((s) => s.trim()).filter(Boolean);
}
function flushSpeechQueue() {
  // 把已排队的句子逐句交给浏览器，onend 里自动接下一句
  if (speechQ.speaking || !speechQ.queue.length || !window.speechSynthesis) return;
  speechQ.speaking = true;
  const text = speechQ.queue.shift();
  const utter = new SpeechSynthesisUtterance(text.slice(0, 200));
  const v = getSelectedVoice();
  // 某些设备给的 voice 对象可能失效，赋值失败不能让整个朗读崩掉
  if (v) { try { utter.voice = v; } catch (e) {} utter.lang = v.lang || 'zh-CN'; }
  utter.rate = store.speechRate ?? 1;
  utter.pitch = store.speechPitch ?? 1;
  utter.onstart = () => setOrbListening(true);
  utter.onend = () => { setOrbListening(false); speechQ.speaking = false; flushSpeechQueue(); };
  utter.onerror = () => { speechQ.speaking = false; flushSpeechQueue(); };
  // 关键修复：cancel() 之后立刻 speak() 在很多浏览器（尤其手机 Chrome）会被吞掉。
  // 稍等一帧再 speak，并且补一次 resume，保证切换声音后也能正常出声。
  laterSpeak(() => {
    try { window.speechSynthesis.resume(); } catch (e) {}
    window.speechSynthesis.speak(utter);
  }, 120);
}
function enqueueSpeech(text) {
  splitSentences(cleanForSpeech(text)).forEach((s) => speechQ.queue.push(s));
  flushSpeechQueue();
}
function stopSpeech() {
  speechQ.queue = [];
  speechQ.speaking = false;
  speechQ.genText = '';
  speechQ.spokenTo = 0;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setOrbListening(false);
}

// 流式生成时调用：只把「新长出来的完整句」追加进队列
function feedSpeechWhileTyping(fullText) {
  if (!store.autoRead || !window.speechSynthesis) return;
  const clean = cleanForSpeech(fullText);
  const cut = Math.max(speechQ.spokenTo, clean.length - 240); // 只处理尾部一段,留完整句
  let safe = cut;
  // 回退到最近的句末标点，避免读半句
  for (let i = clean.length - 1; i >= cut; i--) {
    if ('。！？!?；;\n'.includes(clean[i])) { safe = i + 1; break; }
  }
  if (safe <= speechQ.spokenTo) return;
  const piece = clean.slice(speechQ.spokenTo, safe);
  speechQ.spokenTo = safe;
  splitSentences(piece).forEach((s) => speechQ.queue.push(s));
  flushSpeechQueue();
}

function speak(text) {
  if (!window.speechSynthesis) { toast('这个浏览器不支持朗读'); return; }
  stopSpeech();
  enqueueSpeech(text);
}

function readLast() {
  const list = byId('messages').querySelectorAll('.msg.ai .msg-text');
  const last = list[list.length - 1];
  if (!last || !last.innerText.trim()) { toast('还没有可以朗读的内容'); return; }
  speak(last.innerText);
}

// 系统声音名大多是英文，这里映射成中文，保证设置页不出现英文
const VOICE_CN_MAP = [
  [/xiaoxiao/i, '晓晓'], [/huihui/i, '慧慧'], [/yaoyao/i, '遥遥'],
  [/kangkang/i, '康康'], [/yunxi/i, '云希'], [/yunyang/i, '云扬'],
  [/xiaoshuang/i, '小双'], [/hanyu/i, '涵宇'], [/xiaoyi/i, '晓伊'],
  [/xiaomo/i, '晓墨'], [/xiaoxuan/i, '晓萱'], [/lili/i, '莉莉'],
  [/tingting/i, '婷婷'], [/sinji/i, '信杰'], [/meijia/i, '美佳'],
  [/yating/i, '雅婷'], [/zhiyu/i, '知雨'], [/zira/i, '吉拉'],
  [/david/i, '大卫'], [/mark/i, '马克'], [/aria/i, '阿莉娅'],
  [/jenny/i, '珍妮'], [/guy/i, '盖伊'], [/ana/i, '安娜'],
  [/bill/i, '比尔'], [/samantha/i, '萨曼塔'], [/karen/i, '凯伦'],
  [/google/i, '谷歌'],
];
function voiceLabel(v, idx) {
  const raw = String(v.name || v.voiceURI || '');
  let cn = '';
  for (const [re, name] of VOICE_CN_MAP) { if (re.test(raw)) { cn = name; break; } }
  const lang = langLabel(v.lang);
  const natural = /natural|neural/i.test(raw) ? '自然音色' : '';
  const base = cn || ((lang && lang !== '其他' ? lang : '') + '声音' + (idx ? ' ' + idx : ''));
  return [base, natural].filter(Boolean).join(' · ');
}
// 把 en-US / zh-CN 这类语言代码显示成中文
function langLabel(lang) {
  const l = (lang || '').toLowerCase();
  if (!l) return '';
  if (l.startsWith('zh') && l.includes('hk')) return '粤语';
  if (l.startsWith('yue')) return '粤语';
  if (l.startsWith('zh')) return '中文';
  if (l.startsWith('en')) return l.includes('gb') ? '英文(英)' : '英文(美)';
  if (l.startsWith('ja')) return '日语';
  if (l.startsWith('ko')) return '韩语';
  return '其他';
}

function renderVoices() {
  const box = byId('voiceList');
  if (!box) return;
  const list = getSystemVoices();
  box.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'voice-head';
  head.innerHTML = `<p>下面这些是你这台设备上<b>真实安装</b>的朗读声音，共 <b id="voiceCount">${list.length}</b> 个。点一个就能试听，选中后小智就用它念。</p>
    <div class="voice-switches">
      <label class="voice-switch"><input type="checkbox" id="autoReadToggle" ${store.autoRead ? 'checked' : ''}><span>边写边读（文字一边出、声音一边念）</span></label>
      <label class="voice-rate">语速 <input type="range" id="speechRate" min="0.6" max="1.6" step="0.1" value="${store.speechRate ?? 1}"><span id="rateVal">${store.speechRate ?? 1}×</span></label>
      <button class="voice-refresh" id="voiceRefresh" title="重新读取设备声音"><svg class="icon"><use href="#i-redo"/></svg> 重新读取</button>
    </div>`;
  box.appendChild(head);

  if (!list.length) {
    const tip = document.createElement('div');
    tip.className = 'voice-empty';
    tip.textContent = '声音列表还没加载好。手机上请点一下下面的「重新读取」，或稍等片刻再进这个页面。';
    box.appendChild(tip);
  } else {
    const groups = {};
    list.forEach((v) => { const g = voiceGroup(v.lang); (groups[g] = groups[g] || []).push(v); });
    // 固定顺序：中文、粤语、日语… English 放最后。列表开头不再是英文。
    const orderOf = (g) => { const i = VOICE_GROUP_ORDER.indexOf(g); return i < 0 ? 99 : i; };
    const sortedGroups = Object.keys(groups).sort((a, b) => orderOf(a) - orderOf(b));
    const sel = getSelectedVoice();
    sortedGroups.forEach((g) => {
      const title = document.createElement('div');
      title.className = 'voice-group-title';
      title.textContent = `${g} · ${groups[g].length}`;
      box.appendChild(title);
      groups[g].forEach((v, vi) => {
        const label = voiceLabel(v, vi + 1);
        const row = document.createElement('div');
        const active = sel && (sel.voiceURI === v.voiceURI || sel.name === v.name);
        row.className = 'voice-row' + (active ? ' selected' : '');
        const tag = (v.localService ? '本地' : '在线') + ' · ' + langLabel(v.lang);
        row.innerHTML = `<button class="voice-pick" type="button">
            <span class="voice-dot"><svg class="icon"><use href="#i-volume"/></svg></span>
            <span class="voice-name">${esc(label)}</span>
            <span class="voice-tag">${esc(tag)}</span>
            <svg class="icon check"><use href="#i-check"/></svg>
          </button>
          <button class="voice-del" type="button" title="删掉这个声音" aria-label="删掉 ${esc(label)}">×</button>`;
        // 点选：只改选中态和试听，不重建整个列表（重建会打断朗读、就是"重新来"的毛病）
        row.querySelector('.voice-pick').onclick = () => {
          store.voice = v.voiceURI; persist();
          box.querySelectorAll('.voice-row').forEach((r) => r.classList.remove('selected'));
          row.classList.add('selected');
          byId('voiceValue').textContent = label;
          stopSpeech();
          // 切换声音后立刻用新声音试听，并清掉朗读队列的「已念到」指针，
          // 这样接下来对话里的字会从头用新声音念，不会再出现切换后不朗读。
          speechQ.spokenTo = 0;
          const u = new SpeechSynthesisUtterance('你好，这是你选的朗读声音。');
          try { u.voice = v; } catch (e) {} u.lang = v.lang || 'zh-CN'; u.rate = store.speechRate ?? 1;
          u.onend = () => { try { window.speechSynthesis.resume(); } catch (e) {} };
          laterSpeak(() => {
            try { window.speechSynthesis.resume(); } catch (e) {}
            window.speechSynthesis.speak(u);
          }, 120);
        };
        // 删掉：把这个声音加入隐藏名单，永久不再显示
        row.querySelector('.voice-del').onclick = (e) => {
          e.stopPropagation();
          store.hiddenVoices = store.hiddenVoices || [];
          if (!store.hiddenVoices.includes(v.voiceURI)) store.hiddenVoices.push(v.voiceURI);
          if (store.voice === v.voiceURI || store.voice === v.name) store.voice = '';
          persist(); renderVoices();
          toast('已删掉「' + voiceLabel(v) + '」，可在底部恢复');
        };
        box.appendChild(row);
      });
    });
  }

  const sel0 = getSelectedVoice();
  byId('voiceValue').textContent = sel0 ? voiceLabel(sel0) : '系统默认';

  // 恢复被删掉的声音
  if ((store.hiddenVoices || []).length) {
    const restore = document.createElement('button');
    restore.className = 'voice-restore';
    restore.textContent = `恢复已删掉的声音（${store.hiddenVoices.length}）`;
    restore.onclick = () => { store.hiddenVoices = []; persist(); renderVoices(); toast('已恢复全部声音'); };
    box.appendChild(restore);
  }

  const toggle = byId('autoReadToggle');
  if (toggle) toggle.onchange = () => { store.autoRead = toggle.checked; persist(); if (!toggle.checked) stopSpeech(); };
  const rate = byId('speechRate');
  if (rate) rate.oninput = () => { store.speechRate = parseFloat(rate.value); byId('rateVal').textContent = store.speechRate.toFixed(1) + '×'; persist(); };
  const refresh = byId('voiceRefresh');
  if (refresh) refresh.onclick = () => { window.speechSynthesis?.getVoices(); renderVoices(); toast('已重新读取设备声音'); };
}

/* ---------- 语音通话 + 语音输入 ---------- */
function setOrbListening(on) {
  byId('voiceOrb')?.classList.toggle('listening', !!on);
}

function toggleVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('这个浏览器不支持语音识别，用键盘输入吧'); return; }
  if (state.recognition) { state.recognition.stop(); state.recognition = null; return; }
  const rec = new SR();
  rec.lang = 'zh-CN';
  rec.interimResults = true;
  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    setInput(text);
  };
  rec.onerror = () => { toast('没听清，再说一次'); state.recognition = null; };
  rec.onend = () => { state.recognition = null; byId('voiceInput').classList.remove('send-on'); };
  rec.start();
  state.recognition = rec;
  byId('voiceInput').classList.add('send-on');
  toast('在听，说完自动填入输入框');
}

function toggleCamera() {
  const screen = byId('voiceScreen');
  const on = screen.classList.toggle('show');
  byId('camBtn').classList.toggle('off', !on);
  byId('camBtn').querySelector('use').setAttribute('href', on ? '#i-video' : '#i-video-off');
  byId('voiceTranscript').innerHTML = on ? '<span class="q">视频画面占位</span>画面已接入，声音照常走小智。' : '';
}

function setVoiceStatus(html) { const el = byId('voiceStatus'); if (el) el.innerHTML = html; }
function setVoiceTranscript(who, text) {
  const el = byId('voiceTranscript');
  if (!el) return;
  if (!el.dataset.active) el.innerHTML = '';
  el.dataset.active = '1';
  const line = document.createElement('div');
  line.className = who === 'me' ? 'q' : 'a';
  line.textContent = (who === 'me' ? '你：' : '小智：') + text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

// 语音通话：把识别出的话发给 AI，回复打到通话页并出声朗读
async function callAIFromVoice(text) {
  if (!state.model) {
    setVoiceStatus('没有可用模型。去「设置 → 千帆 AI」填 key，或刷新页面。');
    toast('先去设置里配置一个模型');
    return;
  }
  state.callContext = state.callContext || [];
  state.callContext.push({ role: 'user', content: text });
  setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> 小智正在回应…');
  stopSpeech();
  let full = '';
  try {
    const messages = [
      { role: 'system', content: (typeof SYSTEM_PROMPT !== 'undefined' ? SYSTEM_PROMPT : '') + '\n\n这是语音通话，用口语化的短句回答，一两句话即可，不要列表和代码，方便朗读。' },
      ...state.callContext.slice(-10),
    ];
    let shown = false;
    for await (const piece of streamChat(messages, null)) {
      full += piece;
      if (!shown) { setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> 小智正在说…'); shown = true; }
      feedSpeechWhileTyping(full); // 边出字边念
    }
    const clean = cleanForSpeech(full);
    const tail = clean.slice(speechQ.spokenTo).trim();
    if (tail) speechQ.queue.push(tail);
    flushSpeechQueue();
    setVoiceTranscript('ai', full);
    state.callContext.push({ role: 'assistant', content: full });
    setVoiceStatus('说完了，接着说吧');
  } catch (e) {
    setVoiceStatus('出问题了：' + (friendlyError?.(e) || '请重试'));
  }
}

function toggleMic() {
  const btn = byId('micBtn');
  if (state.recognition) { state.recognition.stop(); state.recognition = null; return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('这个浏览器不支持语音识别，用键盘输入吧'); return; }
  const rec = new SR();
  rec.lang = 'zh-CN';
  rec.interimResults = true;
  rec.continuous = false;
  let said = '';
  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    said = text;
    setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> ' + (text || '在听…'));
  };
  rec.onerror = () => { toast('没听清，再说一次'); setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> 点击麦克风开始说话'); state.recognition = null; };
  rec.onend = () => {
    state.recognition = null;
    if (said && said.trim()) { setVoiceTranscript('me', said.trim()); callAIFromVoice(said.trim()); }
    else setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> 点击麦克风开始说话');
  };
  rec.start();
  state.recognition = rec;
  setVoiceStatus('<span class="eq"><i></i><i></i><i></i><i></i></span> 在听，说吧…');
  toast('在听，说完自动回你');
}

/* ---------- 技能 / 工具 ---------- */
function renderSkills() {
  const box = byId('skillList');
  const q = state.skillQuery.trim().toLowerCase();
  const list = SKILLS.filter((s) => (state.skillTab === 'all' || store.favs.includes(s.name))
    && (!q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)));
  box.innerHTML = '';
  if (!list.length) { box.innerHTML = '<div class="empty-state"><h3>没找到匹配的技能</h3><p>换个词试试。</p></div>'; return; }
  list.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'skill-item';
    row.innerHTML = `<div class="skill-icon" style="background:${s.bg}">${s.emoji}</div>
      <div class="skill-info"><div class="skill-name">${esc(s.name)}</div><div class="skill-desc">${esc(s.desc)}</div></div>
      <button class="use-btn">使用</button>`;
    row.querySelector('.use-btn').onclick = () => {
      goto('chat'); setInput(s.prompt); // 所有技能统一走对话，不在独立面板里操作
    };
    box.appendChild(row);
  });
}

byId('skillTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  state.skillTab = b.dataset.tab;
  $$('#skillTabs button').forEach((x) => x.classList.toggle('active', x === b));
  renderSkills();
});
byId('skillSearch').addEventListener('input', (e) => { state.skillQuery = e.target.value; renderSkills(); });

function renderTools() {
  const box = byId('toolGrid');
  box.innerHTML = '';
  TOOLS.forEach((t) => {
    const card = document.createElement('button');
    card.className = 'tool-card';
    card.innerHTML = `<span class="tool-icon" style="background:${t.bg};color:${t.color}"><svg class="icon"><use href="#${t.icon}"/></svg></span>
      <strong>${esc(t.name)}</strong><span>${esc(t.desc)}</span>`;
    card.onclick = () => openTool(t);
    box.appendChild(card);
  });
  const side = byId('sideTools');
  if (side) {
    side.innerHTML = '';
    TOOLS.slice(0, 6).forEach((t) => {
      const b = document.createElement('button');
      b.className = 'side-tool'; b.textContent = t.name;
      b.onclick = () => openTool(t);
      side.appendChild(b);
    });
  }
}

function openTool(tool) {
  const fields = [...tool.template.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]);
  const content = byId('promptContent');
  content.innerHTML = `<p>${esc(tool.desc)}。把下面的空填好，小智会按这个模板干活，你再决定要不要用。</p>` +
    fields.map((f) => `<label class="field-label" style="margin-top:14px">${esc(f)}</label><input data-field="${esc(f)}" placeholder="输入${esc(f)}">`).join('') +
    `<div class="prompt-actions"><button data-act="cancel">取消</button><button class="primary" data-act="go">交给小智</button></div>`;
  byId('promptTitle').textContent = tool.name;
  openSheet('promptSheet');
  content.querySelector('[data-act="cancel"]').onclick = closeSheets;
  content.querySelector('[data-act="go"]').onclick = () => {
    let text = tool.template;
    let ok = true;
    content.querySelectorAll('[data-field]').forEach((input) => {
      const v = input.value.trim();
      if (!v) { ok = false; input.focus(); return; }
      text = text.replace(`{{${input.dataset.field}}}`, v);
    });
    if (!ok) { toast('还有空没填'); return; }
    closeSheets();
    goto('chat');
    setInput(text);
    sendMessage(text);
  };
}

/* ---------- 创作 ---------- */
function renderCreateTabs() {
  $$('#createTabs button').forEach((b) => b.classList.toggle('active', b.dataset.type === state.createType));
  const labels = {
    image: ['描述你想要的画面', '例如：深夜的便利店，暖黄灯光，玻璃上有雨痕，电影感构图'],
    video: ['描述你想拍的短片', '例如：清晨的城市，30 秒，慢镜头，从天台推到街道'],
    code: ['描述你要的页面或组件', '例如：一个响应式定价页，三档套餐，深色主题'],
  };
  byId('createLabel').textContent = labels[state.createType][0];
  byId('createPrompt').placeholder = labels[state.createType][1];
}
byId('createTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (!b) return;
  state.createType = b.dataset.type;
  renderCreateTabs();
});

byId('createBtn').addEventListener('click', async () => {
  const prompt = byId('createPrompt').value.trim();
  if (!prompt) { toast('先写点描述'); return; }
  const offline = !state.model;
  const style = byId('createStyle').value;
  const btn = byId('createBtn');
  btn.disabled = true; btn.textContent = '生成中…';
  const box = byId('createResult');
  box.innerHTML = '<div class="result-card"><div class="result-script">小智正在动手，稍等一下…</div></div>';

  // 静态版没有模型，直接走本地生成，不让用户对着转圈失望。
  if (offline) {
    setTimeout(() => {
      if (state.createType === 'image') {
        renderCreation('<svg>' + localSVG(prompt, style).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</svg>');
      } else if (state.createType === 'video') {
        renderCreation(localStoryboard(prompt));
      } else {
        toast('网页 Demo 需要真 AI，请用云端版');
        box.innerHTML = '<div class="result-card"><div class="result-script">网页生成属于真 AI 能力，静态版做不了。请用页面顶部的云端版链接。</div></div>';
      }
      btn.disabled = false;
      btn.innerHTML = '<svg class="icon"><use href="#i-spark"/></svg>生成';
    }, 400);
    return;
  }

  const instructions = {
    image: `用纯 SVG 画一张插画：${prompt}。风格：${style}。要求：直接返回完整的 <svg> 标签，不要 Markdown 代码块，不要解释文字；尺寸 viewBox="0 0 800 600"，配色克制，结构清晰。`,
    video: `写一个短视频分镜脚本：${prompt}。按时间轴列出 5-7 个镜头，每个镜头给出时长、画面描述、运镜方式和旁白；最后给一句整体风格说明。用中文。`,
    code: `写一个完整的单文件 HTML 页面：${prompt}。要求内联 CSS 和 JS，响应式，不依赖任何外部资源，代码整洁可直接打开预览。只返回 HTML 代码，不要解释。`,
  };

  let full = '';
  try {
    for await (const piece of streamChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: instructions[state.createType] },
    ], new AbortController().signal)) {
      full += piece;
    }
    renderCreation(full);
    recordAsset(state.createType === 'image' ? '图片' : state.createType === 'video' ? '视频脚本' : '网页', prompt.slice(0, 60));
  } catch (err) {
    box.innerHTML = `<div class="result-card"><div class="result-script" style="color:#c04747">${esc(friendlyError(err))}</div></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg class="icon"><use href="#i-spark"/></svg>生成';
  }
});

function renderCreation(raw) {
  const box = byId('createResult');
  const cleaned = raw.replace(/^```[\w-]*\n?/m, '').replace(/```\s*$/m, '').trim();
  if (state.createType === 'image') {
    const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const safe = svgMatch[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '').replace(/javascript:/gi, '');
      box.innerHTML = `<div class="result-card"><div class="result-art">${safe}</div><div class="prompt-actions"><button data-act="save-svg">保存 SVG</button><button class="primary" data-act="use-svg">放进对话</button></div></div>`;
      box.querySelector('[data-act="save-svg"]').onclick = () => download(safe, 'xiaozhi-art.svg', 'image/svg+xml');
      box.querySelector('[data-act="use-svg"]').onclick = () => { goto('chat'); setInput('这是我刚生成的插画，帮我看看哪里还能改：\n' + svgMatch[0].slice(0, 200)); };
      return;
    }
  }
  if (state.createType === 'code') {
    const html = cleaned.replace(/^<!DOCTYPE html>/i, '').replace(/^<html>/i, '').replace(/<\/html>$/i, '');
    box.innerHTML = `<div class="result-card"><div class="result-art" style="aspect-ratio:auto"><iframe sandbox="allow-scripts" srcdoc="${esc(html)}" style="width:100%;height:320px;border:0;border-radius:12px"></iframe></div><div class="prompt-actions"><button data-act="save-html">下载 HTML</button><button class="primary" data-act="copy-html">复制代码</button></div></div>`;
    box.querySelector('[data-act="save-html"]').onclick = () => download(raw, 'xiaozhi-page.html', 'text/html');
    box.querySelector('[data-act="copy-html"]').onclick = () => copyText(raw);
    return;
  }
  box.innerHTML = `<div class="result-card"><div class="result-script">${renderText(cleaned)}</div><div class="prompt-actions"><button data-act="copy">复制脚本</button></div></div>`;
  box.querySelector('[data-act="copy"]').onclick = () => copyText(cleaned);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- 设置 / 记忆 / 任务 ---------- */
function cycleTheme() {
  const i = THEMES.findIndex((t) => t.name === store.theme);
  const t = THEMES[(i + 1) % THEMES.length];
  store.theme = t.name; persist();
  document.documentElement.style.setProperty('--brand', t.color);
  document.documentElement.style.setProperty('--brand-soft', t.soft);
  byId('themeValue').textContent = t.name;
  toast(`主题切到 ${t.name}`);
}

function toggleMemory(btn) {
  store.memoryOn = !store.memoryOn;
  persist();
  btn.classList.toggle('on', store.memoryOn);
  toast(store.memoryOn ? '记忆已打开' : '记忆已关闭，不再保存新偏好');
}

function renderMemory() {
  byId('memorySwitch').classList.toggle('on', store.memoryOn);
  const box = byId('memoryList');
  if (!store.memories.length) {
    box.innerHTML = '<p style="font-size:12.5px;color:var(--ink-3);line-height:1.7">还没有记住什么。聊到你的偏好时，小智会写到这里，你随时能删。</p>';
    return;
  }
  box.innerHTML = '<strong style="font-size:14px">已记住</strong>' + store.memories.map((m, i) =>
    `<div class="skill-item"><div class="skill-info"><div class="skill-name" style="font-size:14px">${esc(m.text)}</div><div class="skill-desc">${esc(m.at)}</div></div><button class="use-btn" data-i="${i}">删除</button></div>`).join('');
  box.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => {
    store.memories.splice(Number(b.dataset.i), 1); persist(); renderMemory(); toast('删掉了');
  });
}

function addTask() {
  const content = byId('promptContent');
  content.innerHTML = `<p>给小智派一件能做完的事。</p>
    <label class="field-label" style="margin-top:14px">任务内容</label><input id="taskInput" placeholder="例如：整理本周的开源项目清单">
    <div class="prompt-actions"><button data-act="cancel">取消</button><button class="primary" data-act="go">添加</button></div>`;
  byId('promptTitle').textContent = '新任务';
  openSheet('promptSheet');
  content.querySelector('[data-act="cancel"]').onclick = closeSheets;
  content.querySelector('[data-act="go"]').onclick = () => {
    const v = byId('taskInput').value.trim();
    if (!v) { toast('写点内容'); return; }
    store.tasks.unshift({ id: uid(), text: v, done: false, at: now() });
    persist(); closeSheets(); renderTasks(); toast('加上了');
  };
}

function renderTasks() {
  const list = store.tasks.filter((t) => state.taskTab === 'done' ? t.done : !t.done);
  const box = byId('taskList');
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><svg class="icon"><use href="#i-task"/></svg>
      <h3>${state.taskTab === 'done' ? '还没有完成的任务' : '没有进行中的任务'}</h3>
      <p>${state.taskTab === 'done' ? '做完的会显示在这里' : '进行中的任务将显示在这里'}</p></div>`;
    return;
  }
  box.innerHTML = '';
  list.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `<button class="task-check ${t.done ? 'done' : ''}"><svg class="icon"><use href="#i-check"/></svg></button>
      <div class="task-main ${t.done ? 'done' : ''}"><strong>${esc(t.text)}</strong><small>${esc(t.at)}</small></div>`;
    card.querySelector('.task-check').onclick = () => {
      t.done = !t.done; persist(); renderTasks();
    };
    box.appendChild(card);
  });
}
byId('taskTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  state.taskTab = b.dataset.tab;
  $$('#taskTabs button').forEach((x) => x.classList.toggle('active', x === b));
  renderTasks();
});

/* ---------- 侧栏 / 历史 ---------- */
function renderHistory() {
  const box = byId('historyList');
  box.innerHTML = '';
  store.history.slice(0, 12).forEach((h) => {
    const b = document.createElement('button');
    b.className = 'history-item' + (state.currentChat?.id === h.id ? ' active' : '');
    b.textContent = h.title || '新对话';
    b.onclick = () => {
      state.currentChat = store.history.find((x) => x.id === h.id) || h;
      const messages = byId('messages');
      messages.innerHTML = '';
      messages.appendChild(buildWelcome());
      state.currentChat.context.forEach((m) => appendMsg(m.role, m.content, { actions: m.role === 'ai' }));
      if (!state.currentChat.context.length) renderWelcomePrompts();
      renderHistory(); goto('chat');
    };
    box.appendChild(b);
  });
}

function updateSideContext() {
  const el = byId('sideContext');
  if (!el) return;
  if (!state.currentChat) { el.textContent = '还没有对话。发一条消息试试。'; return; }
  const turns = state.currentChat.context.length / 2;
  el.innerHTML = `<strong>${esc(state.currentChat.title)}</strong><br>${turns} 轮对话 · ${esc(state.currentChat.at)}<br>模型：${esc(state.model?.name || state.model?.id || '未选')}`;
}

function recordAsset(type, text) {
  store.assets.unshift({ type, text, at: now() });
  store.assets = store.assets.slice(0, 20);
  persist();
  const box = byId('sideAssets');
  if (!box) return;
  if (store.assets.length === 1) box.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'asset-item';
  item.textContent = `${type} · ${text}`;
  box.prepend(item);
}

/* ---------- 供 MCP 工具调用的通用接口 ---------- */
async function xzAsk(prompt, system = SYSTEM_PROMPT) {
  if (!state.model) throw new Error('没有可用模型，去设置里填千帆 key 或连接云端');
  let out = '';
  for await (const piece of streamChat([
    { role: 'system', content: system }, { role: 'user', content: prompt },
  ], null)) {
    out += piece;
  }
  return out;
}

// 暴露给 mcp.js 使用，避免把内部状态散落到两个文件
window.XZ = {
  ask: xzAsk,
  localSVG,
  localStoryboard,
  toast,
  isCloudReady: () => !!state.model && (state.cloudReady || currentSource() === 'qianfan'),
  systemPrompt: SYSTEM_PROMPT,
};

/* ---------- 千帆 AI 设置页 ---------- */
function refreshQfUI() {
  const has = !!(window.QIANFAN?.getKey?.());
  const mini = byId('qfStatusMini');
  if (mini) mini.textContent = has ? '已配置' : '未配置';
  const box = byId('qfModels');
  if (box) {
    const models = window.QIANFAN?.models?.() || [];
    byId('qfModelCount').textContent = `${models.filter((m) => m.free).length} 个免费`;
    box.innerHTML = models.map((m) =>
      `<div class="mcp-tool"><strong>${esc(m.name)} ${m.free ? '<span class="mo-tag free">免费</span>' : ''}</strong><span>${esc(m.note)}</span></div>`
    ).join('');
  }
}

function initQianfanUI() {
  const input = byId('qfKey');
  const result = byId('qfTestResult');
  if (input) {
    const saved = window.QIANFAN?.getKey?.() || '';
    input.value = saved;
    byId('qfToggle')?.addEventListener('click', () => { input.type = input.type === 'password' ? 'text' : 'password'; });
    byId('qfSave')?.addEventListener('click', async () => {
      const v = (input.value || '').trim();
      if (!v) { toast('先填入千帆 key'); return; }
      window.QIANFAN.setKey(v);
      refreshQfUI();
      state.qianfanReady = true;
      result.textContent = '正在测试 key…';
      // 用免费模型实测一次，给用户明确结果
      try {
        await window.QIANFAN.ask('只回复两个字：可用', '', 'ernie-speed-8k');
        result.textContent = '✓ key 可用，免费模型能调通。去顶部模型切换选一个开始。';
        loadModels();
        toast('千帆 key 已保存并验证');
      } catch (err) {
        result.textContent = '⚠ ' + (window.QIANFAN.friendly?.(err) || err.message);
        loadModels();
        toast('key 已保存，但测试没通过，看下方提示');
      }
    });
    byId('qfClear')?.addEventListener('click', () => {
      window.QIANFAN.clearKey();
      input.value = '';
      state.qianfanReady = false;
      refreshQfUI();
      result.textContent = '已清除本机 key。';
      loadModels();
    });
  }
  refreshQfUI();
}

/* ---------- GitHub 数据同步 ---------- */
function refreshSyncUI() {
  const has = !!(window.GHSync?.getToken?.());
  const mini = byId('syncStatusMini');
  if (mini) mini.textContent = has ? '已配置' : '未配置';
}

function initSyncUI() {
  const tok = byId('ghToken');
  const repo = byId('ghRepo');
  const result = byId('ghResult');
  const say = (m) => { if (result) result.textContent = m; };
  if (repo && window.GHSync) repo.value = window.GHSync.getRepo();
  if (tok && window.GHSync) tok.value = window.GHSync.getToken();

  byId('ghToggle')?.addEventListener('click', () => { if (tok) tok.type = tok.type === 'password' ? 'text' : 'password'; });

  byId('ghSave')?.addEventListener('click', async () => {
    if (!window.GHSync) { say('同步脚本没加载，刷新页面'); return; }
    const v = (tok?.value || '').trim();
    if (!v) { say('先填入 GitHub token'); return; }
    window.GHSync.setToken(v);
    if (repo?.value.trim()) window.GHSync.setRepo(repo.value.trim());
    refreshSyncUI();
    say('正在验证 token…');
    try {
      const info = await window.GHSync.test();
      say(`✓ 连接成功：${info.full_name}（${info.private ? '私有' : '公开'}）。可以上传/拉取了。`);
      toast('GitHub 令牌已保存并验证');
    } catch (err) {
      say('⚠ ' + err.message);
      toast('token 已保存，但验证失败，看下方提示');
    }
  });

  byId('ghUpload')?.addEventListener('click', async () => {
    if (!window.GHSync) { say('同步脚本没加载，刷新页面'); return; }
    say('正在上传…');
    try {
      // 先拉一次拿 sha，避免冲突
      let sha = null;
      try { const cur = await window.GHSync.pull(); sha = cur.sha; } catch (e) { /* 文件可能不存在，直接新建 */ }
      const data = {};
      window.GHSync.FIELDS.forEach((k) => { data[k] = store[k]; });
      data.updatedAt = new Date().toISOString();
      await window.GHSync.push(data, sha);
      say('✓ 已上传到 GitHub（' + new Date().toLocaleString('zh-CN') + '）');
      toast('数据已存到 GitHub 私有仓库');
    } catch (err) {
      say('上传失败：' + err.message);
    }
  });

  byId('ghDownload')?.addEventListener('click', async () => {
    if (!window.GHSync) { say('同步脚本没加载，刷新页面'); return; }
    say('正在拉取…');
    try {
      const { data } = await window.GHSync.pull();
      window.GHSync.FIELDS.forEach((k) => { if (data[k] !== undefined) store[k] = data[k]; });
      persist();
      // 重画所有受影响的界面
      renderHistory(); renderTasks(); renderMemory();
      byId('themeValue').textContent = store.theme;
      refreshQfUI();
      say('✓ 已拉取并覆盖本机数据（' + (data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : '未知时间') + '）');
      toast('数据已从 GitHub 同步');
    } catch (err) {
      say('拉取失败：' + err.message);
    }
  });

  refreshSyncUI();
}

/* ---------- 环境自适应 ---------- */
// 云端域名能校验 Origin 调真模型；GitHub Pages 等静态域名只能跑本地能力。
const CLOUD_HOST = 'xiaozhi-studio-61540.app.workbuddy.host';
function isCloudHost() {
  const h = location.hostname.toLowerCase();
  return h === CLOUD_HOST || h.endsWith('.workbuddy.host') || h.endsWith('.workbuddy.link');
}
function showEnvBanner() {
  const banner = byId('envBanner');
  banner.innerHTML = `<span>数据只存本机。要让 AI 真对话：去「设置 → 千帆 AI」填 key（免费模型即可），静态版也能用。</span><button data-action="dismiss-banner" aria-label="关闭"><svg class="icon"><use href="#i-close"/></svg></button>`;
  banner.hidden = false;
  banner.querySelector('[data-action="dismiss-banner"]').onclick = () => { banner.hidden = true; };
}

// 离线兜底：没有模型时也能画一张有模有样的 SVG，不靠假装 AI 回复。
function localSVG(prompt, style) {
  const palettes = {
    '写实': ['#23324a', '#4a6b8c', '#d9c7a3', '#e8e3d8'],
    '插画': ['#2f6fd0', '#7db4ea', '#f4c95d', '#f08a5d'],
    '像素': ['#1d2b53', '#7e2553', '#00a868', '#ffcd75'],
    '水墨': ['#2b2b2b', '#6b6b6b', '#b8b8b8', '#efece4'],
  };
  const seed = [...prompt].reduce((a, c) => a + c.charCodeAt(0), 0);
  const p = palettes[style] || palettes['插画'];
  const sun = 120 + (seed % 160);
  const moon = 60 + (seed % 90);
  const hills = [430, 470, 500].map((y, i) => {
    const off = (seed % 40) * (i % 2 ? -1 : 1);
    return `<path d="M0 ${y} Q 200 ${y - 90 - off} 400 ${y - 10} T 800 ${y - 40} V600 H0 Z" fill="${p[i]}" opacity="${0.9 - i * 0.12}"/>`;
  }).join('');
  const title = prompt.replace(/[<>]/g, '').slice(0, 26);
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="${p[3]}"/>
  <circle cx="${sun}" cy="180" r="${moon}" fill="${p[2]}" opacity="0.85"/>
  ${hills}
  <g fill="${p[0]}" opacity="0.85">
    <rect x="640" y="360" width="90" height="150"/>
    <rect x="655" y="330" width="60" height="40"/>
    <rect x="662" y="390" width="18" height="24" fill="${p[2]}"/>
    <rect x="692" y="390" width="18" height="24" fill="${p[2]}"/>
    <rect x="662" y="440" width="18" height="24" fill="${p[2]}"/>
  </g>
  <text x="40" y="560" font-family="sans-serif" font-size="20" fill="${p[0]}" opacity="0.55">${esc(title)}</text>
</svg>`;
}

function localStoryboard(prompt) {
  const beats = [
    ['0-4s', '远景 establishing', '缓慢横移，交代环境与时间', '（无旁白，留环境音）'],
    ['4-9s', '中景主体进入', '推镜，焦点落在主体', `旁白：${prompt.slice(0, 20)}…`],
    ['9-14s', '细节特写', '浅景深，固定机位', '点出关键情绪或信息'],
    ['14-20s', '动作段落', '跟拍，节奏加快', '音乐起'],
    ['20-26s', '全景收束', '拉升拉远，回到开场构图', '旁白收尾，留白两秒'],
  ];
  return beats.map(([t, shot, move, voice], i) =>
    `镜头 ${i + 1} · ${t}\n画面：${shot}\n运镜：${move}\n${voice}`).join('\n\n');
}

/* ---------- 启动 ---------- */
function boot() {
  document.documentElement.style.setProperty('--brand', THEMES.find((t) => t.name === store.theme)?.color || THEMES[0].color);
  document.documentElement.style.setProperty('--brand-soft', THEMES.find((t) => t.name === store.theme)?.soft || THEMES[0].soft);
  byId('themeValue').textContent = store.theme;
  renderWelcomePrompts();
  renderSkills();
  renderTools();
  renderVoices();
  renderMemory();
  renderTasks();
  renderHistory();
  renderCreateTabs();
  initQianfanUI();
  initSyncUI();
  // 手机和 Chrome 首次 getVoices 常为空，等系统把声音列表加载好再重画
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', renderVoices);
  }
  if (isCloudHost()) {
    byId('modelCurrent').textContent = '正在准备云端…';
    // SDK 异步加载：就绪后再初始化云端，界面与所有按钮不受 CDN 加载影响
    if (typeof window.whenSdk === 'function') {
      window.whenSdk(() => {
        initCloud();
        // 云端 SDK 即便没就绪，千帆 key 也要进模型列表
        if (!state.cloudReady && window.QIANFAN?.getKey?.()) loadModels();
      });
    } else {
      initCloud();
    }
  } else {
    showEnvBanner();
    // 静态版：有千帆 key 就加载千帆模型，真 AI 照样能用
    if (window.QIANFAN?.getKey?.()) {
      loadModels();
    } else {
      byId('modelCurrent').textContent = '去「设置 → 千帆 AI」填 key，静态版也能用真 AI。';
    }
  }
}

boot();
