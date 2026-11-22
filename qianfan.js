/* 百度千帆 · 免费模型接入
   只负责网络层：填 key -> 直连千帆 OpenAI 兼容接口 -> 流式吐出文字。
   渲染交给 app.js。key 只存浏览器本地，不进代码、不进仓库。 */
(function () {
  'use strict';

  var KEY_STORAGE = 'xz_qianfan_key_v1';
  var ENDPOINT = 'https://qianfan.baidubce.com/v2/chat/completions';

  // 千帆免费 / 低成本模型（model 参数是官方 v2 接口的准确值）
  // free:true 为官方标注的免费模型，其余为低成本可选
  var MODELS = [
    { id: 'ernie-speed-8k',   name: 'ERNIE Speed 8K',   free: true,  note: '免费 · 响应快，日常首选' },
    { id: 'ernie-lite-8k',    name: 'ERNIE Lite 8K',    free: true,  note: '免费 · 轻量，速度快' },
    { id: 'ernie-tiny-8k',    name: 'ERNIE Tiny 8K',    free: true,  note: '免费 · 极小超快' },
    { id: 'ernie-3.5-8k',     name: 'ERNIE 3.5 8K',     free: true,  note: '免费 · 效果更好' },
    { id: 'qianfan-agent-speed-8k', name: 'Qianfan Agent Speed', free: true, note: '免费 · 对话优化' },
    { id: 'qianfan-agent-lite-8k',  name: 'Qianfan Agent Lite',  free: true, note: '免费 · 轻量对话' },
    { id: 'ernie-speed-128k', name: 'ERNIE Speed 128K', free: false, note: '长文本 · 可能为付费' },
    { id: 'ernie-char-8k',    name: 'ERNIE Character',  free: false, note: '角色扮演 · 可能为付费' },
    { id: 'deepseek-v3',      name: 'DeepSeek V3',      free: false, note: '第三方 · 看账号权限' },
  ];

  function getKey() { try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; } }
  function setKey(v) { try { localStorage.setItem(KEY_STORAGE, (v || '').trim()); } catch (e) {} }
  function clearKey() { try { localStorage.removeItem(KEY_STORAGE); } catch (e) {} }

  function models() { return MODELS.slice(); }

  // 把千帆/通用的错误翻成人话
  function friendly(err) {
    var code = err && err.error && err.error.code || '';
    var msg = err && err.error && err.error.message || err && err.message || String(err);
    if (/invalid_iam_token|unauthorized|invalid_api_key|401/i.test(msg + ' ' + code))
      return '千帆 key 无效或已过期，去设置里检查 key。';
    if (/invalid_model|no access|access_denied|model_offline/i.test(code + ' ' + msg))
      return '这个 key 还没开通该模型：去千帆控制台「模型服务→开通模型」把免费模型开通（通常免费模型点一下即开通），再回来用。';
    if (/quota|rate|限流|429/i.test(code + ' ' + msg))
      return '千帆触发限流或额度限制，等几秒再试。';
    if (/failed to fetch|network|networkerror/i.test(msg))
      return '连不上千帆服务器，检查网络（手机建议用系统浏览器）。';
    return msg;
  }

  // 流式对话：异步生成器，每产出一段文字就 yield 出来
  // messages: [{role,content}], modelId: 模型 id, signal: AbortSignal
  async function* chatStream(messages, modelId, signal) {
    var key = getKey();
    if (!key) throw new Error('还没填千帆 key：去 设置 → 千帆 AI 填 key');
    var resp;
    try {
      resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          stream: true,
          temperature: 0.7,
        }),
        signal: signal,
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw new Error(friendly(e));
    }

    if (!resp.ok) {
      var body = '';
      try { body = await resp.text(); } catch (e) {}
      var parsed = null;
      try { parsed = JSON.parse(body); } catch (e) {}
      throw new Error(friendly(parsed || { error: { code: String(resp.status), message: body.slice(0, 200) } }));
    }

    var reader = resp.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buf = '';
    try {
      while (true) {
        var r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        var lines = buf.split('\n');
        buf = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || line.indexOf('data:') !== 0) continue;
          var data = line.slice(5).trim();
          if (data === '[DONE]') return;
          var obj;
          try { obj = JSON.parse(data); } catch (e) { continue; }
          var delta = obj.choices && obj.choices[0] && obj.choices[0].delta;
          if (delta && delta.content) yield delta.content;
        }
      }
    } finally {
      try { reader.releaseLock(); } catch (e) {}
    }
  }

  // 非流式（供 MCP 工具调用等用）
  async function ask(prompt, systemPrompt, modelId) {
    var key = getKey();
    if (!key) throw new Error('还没填千帆 key');
    var msgs = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push({ role: 'user', content: prompt });
    var resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId || 'ernie-speed-8k', messages: msgs, stream: false, temperature: 0.7 }),
    });
    if (!resp.ok) {
      var body = ''; try { body = await resp.text(); } catch (e) {}
      var parsed = null; try { parsed = JSON.parse(body); } catch (e) {}
      throw new Error(friendly(parsed || { error: { message: body.slice(0, 200) } }));
    }
    var data = await resp.json();
    return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
  }

  window.QIANFAN = {
    getKey: getKey, setKey: setKey, clearKey: clearKey,
    models: models, chatStream: chatStream, ask: ask, friendly: friendly,
  };
})();
