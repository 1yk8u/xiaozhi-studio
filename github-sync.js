/* GitHub 私人数据仓库同步
   用 fine-grained PAT 读写私有仓库里的 data.json，实现手机/电脑数据互通。
   token 只存本机 localStorage，不进代码、不进仓库。 */
(function () {
  'use strict';

  var TOKEN_KEY = 'xz_gh_token_v1';
  var REPO_KEY = 'xz_gh_repo_v1';
  var API = 'https://api.github.com';
  var DEFAULT_REPO = '1yk8u/xiaozhi-studio-data';
  var FILE = 'data.json';
  var FIELDS = ['history', 'tasks', 'memories', 'favs', 'voice', 'speechRate', 'theme', 'memoryOn',
    'autoRead', 'autoTool', 'hiddenVoices', 'asrLang', 'points', 'checkinDays', 'quizDone', 'friends',
    'myCode', 'simpleMode', 'persona', 'botName', 'botAvatar', 'speechPitch'];

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(v) { try { localStorage.setItem(TOKEN_KEY, (v || '').trim()); } catch (e) {} }
  function getRepo() { try { return localStorage.getItem(REPO_KEY) || DEFAULT_REPO; } catch (e) { return DEFAULT_REPO; } }
  function setRepo(v) { try { localStorage.setItem(REPO_KEY, (v || '').trim() || DEFAULT_REPO); } catch (e) {} }
  function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  function headers() {
    return {
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  function friendly(resp, body) {
    if (resp.status === 401) return 'token 无效或已过期，重新生成再填。';
    if (resp.status === 404) return '找不到数据仓库或文件。检查仓库名，确认 token 有该仓库权限。';
    if (resp.status === 403) return '没有写入权限。token 需要该私有仓库的 Contents 读写权限（或触发了限流）。';
    if (resp.status === 409) return '文件版本冲突，先「从 GitHub 拉取」再上传。';
    var msg = body && (body.message || body.error) || '';
    return 'GitHub 请求失败（' + resp.status + '）' + (msg ? '：' + msg : '');
  }

  // 从 GitHub 拉数据
  async function pull() {
    if (!getToken()) throw new Error('先填 GitHub token');
    var url = API + '/repos/' + getRepo() + '/contents/' + FILE;
    var resp;
    try {
      resp = await fetch(url, { headers: headers() });
    } catch (e) { throw new Error('连不上 GitHub，检查网络'); }
    var body = null;
    try { body = await resp.json(); } catch (e) {}
    if (!resp.ok) throw new Error(friendly(resp, body));
    var content = (body && body.content || '').replace(/\s/g, '');
    var json;
    try {
      json = JSON.parse(decodeURIComponent(escape(atob(content))));
    } catch (e) {
      try { json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)))); }
      catch (e2) { throw new Error('数据文件解析失败'); }
    }
    return { data: json, sha: body.sha };
  }

  // 推数据到 GitHub
  async function push(data, sha) {
    if (!getToken()) throw new Error('先填 GitHub token');
    var url = API + '/repos/' + getRepo() + '/contents/' + FILE;
    var payload = {
      message: '小智工作台数据同步 ' + new Date().toISOString().slice(0, 16),
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
      branch: 'main',
    };
    if (sha) payload.sha = sha;
    var resp;
    try {
      resp = await fetch(url, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) });
    } catch (e) { throw new Error('连不上 GitHub，检查网络'); }
    var body = null;
    try { body = await resp.json(); } catch (e) {}
    if (!resp.ok) throw new Error(friendly(resp, body));
    return body;
  }

  // 验证 token 是否有效（读一下仓库）
  async function test() {
    if (!getToken()) throw new Error('先填 GitHub token');
    var resp;
    try { resp = await fetch(API + '/repos/' + getRepo(), { headers: headers() }); }
    catch (e) { throw new Error('连不上 GitHub，检查网络'); }
    var body = null; try { body = await resp.json(); } catch (e) {}
    if (!resp.ok) throw new Error(friendly(resp, body));
    return body;
  }

  window.GHSync = {
    getToken, setToken, getRepo, setRepo, clearToken,
    pull, push, test, FIELDS, DEFAULT_REPO,
  };
})();
