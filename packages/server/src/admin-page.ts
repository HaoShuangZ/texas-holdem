// 管理后台单页（/admin），左右布局：左侧菜单 + 右侧内容
export const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>德州扑克 · 管理后台</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { height:100%; }
  body { background:#0a0a0a; color:#fff; font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; }
  /* ===== 左右布局 ===== */
  .layout { display:flex; height:100vh; }
  .sidebar { width:200px; min-width:200px; background:#111; border-right:1px solid #2a2a2a; display:flex; flex-direction:column; }
  .side-title { padding:20px 16px 14px; text-align:center; border-bottom:1px solid #2a2a2a; }
  .side-title .logo { color:#d4a843; font-size:18px; font-weight:bold; letter-spacing:.12em; }
  .side-title .sub { color:#555; font-size:11px; margin-top:4px; }
  .menu { flex:1; padding:14px 10px; }
  .menu-item { display:block; width:100%; text-align:left; padding:11px 14px; margin-bottom:6px; border-radius:10px;
    background:transparent; color:#888; font-size:14px; border:1px solid transparent; cursor:pointer; }
  .menu-item:hover { color:#ccc; background:#181818; }
  .menu-item.active { color:#d4a843; background:#1a1a1a; border-color:#3a3222; font-weight:bold; }
  .side-foot { padding:14px 10px; border-top:1px solid #2a2a2a; }
  .logout { display:block; width:100%; padding:10px; text-align:center; border-radius:10px;
    background:#1e1e1e; color:#aaa; font-size:13px; border:1px solid #2a2a2a; cursor:pointer; }
  .logout:hover { border-color:#e74c3c; color:#e74c3c; }
  .main { flex:1; overflow-y:auto; padding:24px; }
  .main-inner { max-width:900px; margin:0 auto; }
  /* ===== 通用组件 ===== */
  .card { background:#111; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:18px; }
  .card h2 { font-size:13px; color:#8a7a5a; letter-spacing:.15em; margin-bottom:14px; }
  label { display:block; font-size:11px; color:#8a7a5a; margin:10px 0 5px; }
  input { width:100%; background:#0a0a0a; border:1px solid #2a2a2a; border-radius:10px; padding:10px 12px; color:#fff; font-size:14px; outline:none; }
  input:focus { border-color:#b8860b; }
  button { cursor:pointer; border:none; border-radius:9px; font-weight:bold; font-size:13px; font-family:inherit; }
  .btn-main { width:100%; padding:11px; margin-top:16px; background:linear-gradient(90deg,#b8860b,#d4a843); color:#000; }
  .btn-main:disabled { opacity:.4; cursor:not-allowed; }
  .btn-sm { padding:5px 10px; font-size:12px; background:#1e1e1e; color:#ccc; border:1px solid #333; margin:0 3px; }
  .btn-sm:hover { border-color:#d4a843; color:#d4a843; }
  .btn-sm.danger:hover { border-color:#e74c3c; color:#e74c3c; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; color:#666; font-size:11px; padding:8px 6px; border-bottom:1px solid #2a2a2a; }
  td { padding:10px 6px; border-bottom:1px solid #1a1a1a; }
  tr:hover td { background:#151515; }
  .chips { color:#d4a843; font-weight:bold; }
  .msg { margin-top:12px; font-size:12px; min-height:16px; }
  .msg.ok { color:#2ecc71; } .msg.err { color:#e74c3c; }
  .stats { color:#888; font-size:11px; }
  .empty { color:#555; text-align:center; padding:24px 0; font-size:13px; }
  /* ===== 登录门 ===== */
  .gate-wrap { height:100vh; display:flex; align-items:center; justify-content:center; }
  .gate { width:320px; text-align:center; }
  .gate h2 { font-size:15px; color:#8a7a5a; letter-spacing:.2em; margin-bottom:16px; }
  /* ===== 移动端：侧栏变顶栏 ===== */
  @media (max-width:720px) {
    .layout { flex-direction:column; }
    .sidebar { width:100%; min-width:0; flex-direction:row; align-items:center; border-right:none; border-bottom:1px solid #2a2a2a; }
    .side-title { padding:10px 12px; border-bottom:none; }
    .side-title .sub { display:none; }
    .menu { display:flex; padding:6px; flex:1; overflow-x:auto; }
    .menu-item { width:auto; white-space:nowrap; padding:8px 12px; margin:0 3px; }
    .side-foot { border-top:none; padding:6px 10px; }
    .main { padding:14px; }
  }
</style>
</head>
<body>

<!-- 登录门 -->
<div id="gate" class="gate-wrap">
  <div class="card gate">
    <h2>管 理 后 台</h2>
    <input type="password" id="pw" placeholder="请输入管理密码" onkeydown="if(event.key==='Enter')load()">
    <button class="btn-main" onclick="load()">进入后台</button>
    <div class="msg" id="gateMsg"></div>
  </div>
</div>

<!-- 主布局：左菜单 + 右内容 -->
<div id="layout" class="layout" style="display:none">
  <aside class="sidebar">
    <div class="side-title">
      <div class="logo">德州扑克</div>
      <div class="sub">管理后台</div>
    </div>
    <nav class="menu">
      <button class="menu-item active" id="mi-users" onclick="switchMenu('users')">账号管理</button>
      <button class="menu-item" id="mi-logs" onclick="switchMenu('logs')">登录记录</button>
      <button class="menu-item" id="mi-chips" onclick="switchMenu('chips')">对局记录</button>
      <button class="menu-item" id="mi-settings" onclick="switchMenu('settings')">游戏设置</button>
    </nav>
    <div class="side-foot">
      <button class="logout" onclick="logout()">退出登录</button>
    </div>
  </aside>

  <main class="main">
    <div class="main-inner">

      <!-- 账号管理 -->
      <section id="sec-users">
        <div class="card">
          <h2>创建账号</h2>
          <div style="display:flex; gap:12px; flex-wrap:wrap">
            <div style="flex:2; min-width:140px"><label>账户名</label><input id="nu"></div>
            <div style="flex:2; min-width:140px"><label>密码（至少4位）</label><input id="np" type="text"></div>
            <div style="flex:1; min-width:100px"><label>初始筹码</label><input id="nc" type="number" value="50000"></div>
          </div>
          <button class="btn-main" onclick="createUser()">创建账号</button>
          <div class="msg" id="createMsg"></div>
        </div>

        <div class="card">
          <h2>账号列表（<span id="cnt">0</span>）</h2>
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>账户名</th><th>筹码</th><th>战绩</th><th>创建时间</th><th>操作</th></tr></thead>
              <tbody id="rows"></tbody>
            </table>
          </div>
          <div class="empty" id="empty" style="display:none">还没有账号，先创建一个</div>
          <div class="msg" id="listMsg"></div>
        </div>
      </section>

      <!-- 登录记录 -->
      <section id="sec-logs" style="display:none">
        <div class="card">
          <h2>登录记录（最近100条）
            <button class="btn-sm" style="float:right" onclick="loadLogs()">刷新</button>
          </h2>
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>时间</th><th>账户名</th><th>IP地址</th><th>设备</th></tr></thead>
              <tbody id="logRows"></tbody>
            </table>
          </div>
          <div class="empty" id="logEmpty" style="display:none">暂无登录记录</div>
        </div>
      </section>

      <!-- 对局记录 -->
      <section id="sec-chips" style="display:none">
        <div class="card">
          <h2>对局/筹码记录（最近100条）
            <button class="btn-sm" style="float:right" onclick="loadChipLogs()">刷新</button>
          </h2>
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>时间</th><th>账户名</th><th>变动</th><th>变动后余额</th><th>类型</th><th>详情</th></tr></thead>
              <tbody id="chipRows"></tbody>
            </table>
          </div>
          <div class="empty" id="chipEmpty" style="display:none">暂无筹码变动记录</div>
        </div>
      </section>

      <!-- 游戏设置 -->
      <section id="sec-settings" style="display:none">
        <div class="card">
          <h2>免上头保护</h2>
          <label>单手投入上限（筹码数，0 表示不限制）</label>
          <input id="sMaxBet" type="number" min="0" placeholder="0 = 不限制">
          <p class="stats" style="margin-top:8px; line-height:1.8">
            设置后，每位玩家在一手牌中最多只能投入该数量的筹码，加注和全下都会被限制，
            超出部分留在手里下一手再用，可防止玩家上头一把梭哈。<br>
            注意：上限需大于等于房间大盲注才生效；保存后对新开始的对局生效，进行中的对局不受影响。
          </p>
          <button class="btn-main" onclick="saveSettings()">保存设置</button>
          <div class="msg" id="settingsMsg"></div>
        </div>
      </section>

    </div>
  </main>
</div>

<script>
const $ = id => document.getElementById(id)
const pw = () => localStorage.getItem('poker_admin_pw') || ''
const headers = () => ({ 'Content-Type':'application/json', 'x-admin-password': pw() })
const fmt = n => Number(n).toLocaleString()
const fmtTime = t => t ? new Date(t).toLocaleDateString('zh-CN') : '-'

/* ===== 菜单切换 ===== */
function switchMenu(name){
  for (const m of ['users','logs','chips','settings']) {
    $('mi-' + m).classList.toggle('active', m === name)
    $('sec-' + m).style.display = m === name ? '' : 'none'
  }
  if (name === 'logs') loadLogs()
  if (name === 'chips') loadChipLogs()
  if (name === 'settings') loadSettings()
}

async function loadSettings(){
  const r = await fetch('/api/admin/settings', { headers: headers() })
  if (r.status === 401) { location.reload(); return }
  const d = await r.json()
  $('sMaxBet').value = d.maxBet || 0
}

async function saveSettings(){
  const v = Number($('sMaxBet').value) || 0
  const r = await fetch('/api/admin/settings', { method:'POST', headers: headers(), body: JSON.stringify({ maxBet: v }) })
  const d = await r.json()
  if (!r.ok) { show('settingsMsg', false, d.error || '保存失败'); return }
  show('settingsMsg', true, v > 0 ? '已保存：单手投入上限 ' + fmt(v) : '已保存：不限制')
}

function logout(){
  localStorage.removeItem('poker_admin_pw')
  location.reload()
}

async function load(){
  localStorage.setItem('poker_admin_pw', $('pw').value)
  const r = await fetch('/api/admin/users', { headers: headers() })
  if (r.status === 401) { $('gateMsg').textContent = '管理密码错误'; $('gateMsg').className = 'msg err'; return }
  $('gate').style.display = 'none'
  $('layout').style.display = 'flex'
  switchMenu('users')
  refresh()
  loadLogs()
  loadChipLogs()
}

async function refresh(){
  const r = await fetch('/api/admin/users', { headers: headers() })
  if (r.status === 401) { location.reload(); return }
  const d = await r.json()
  const users = d.users || []
  $('cnt').textContent = users.length
  $('empty').style.display = users.length ? 'none' : ''
  $('rows').innerHTML = users.map(u =>
    '<tr>' +
    '<td><b>' + esc(u.username) + '</b><br><span class="stats">' + esc(u.avatar || '') + '</span></td>' +
    '<td class="chips">' + fmt(u.chips_balance) + '</td>' +
    '<td class="stats">' + u.games_played + '局 / 胜' + u.games_won + '</td>' +
    '<td class="stats">' + fmtTime(u.created_at) + '</td>' +
    '<td style="white-space:nowrap">' +
    '<button class="btn-sm" onclick="resetPw(\\'' + u.id + '\\',\\'' + esc(u.username) + '\\')">改密码</button>' +
    '<button class="btn-sm" onclick="setChips(\\'' + u.id + '\\',\\'' + esc(u.username) + '\\',' + u.chips_balance + ')">筹码</button>' +
    '<button class="btn-sm danger" onclick="delUser(\\'' + u.id + '\\',\\'' + esc(u.username) + '\\')">删除</button>' +
    '</td></tr>'
  ).join('')
}

function esc(s){ return String(s ?? '').replace(/[<>&"']/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m])) }
function show(id, ok, text){ const el = $(id); el.textContent = text; el.className = 'msg ' + (ok ? 'ok' : 'err') }

async function loadLogs(){
  const r = await fetch('/api/admin/login-logs', { headers: headers() })
  if (r.status === 401) { location.reload(); return }
  const d = await r.json()
  const logs = d.logs || []
  $('logEmpty').style.display = logs.length ? 'none' : ''
  $('logRows').innerHTML = logs.map(g =>
    '<tr>' +
    '<td class="stats">' + fmtTime(g.created_at) + ' ' + (g.created_at ? new Date(g.created_at).toTimeString().slice(0,8) : '') + '</td>' +
    '<td><b>' + esc(g.username) + '</b></td>' +
    '<td class="chips">' + esc(g.ip || '-') + '</td>' +
    '<td class="stats">' + esc(dev(g.user_agent)) + '</td>' +
    '</tr>'
  ).join('')
}

function dev(ua){
  ua = String(ua || '')
  let os = /Android/i.test(ua) ? '安卓' : /iPhone|iPad|iOS/i.test(ua) ? '苹果' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : '未知'
  let br = /Edg/i.test(ua) ? 'Edge浏览器' : /MicroMessenger/i.test(ua) ? '微信内置' : /Chrome/i.test(ua) ? 'Chrome浏览器' : /Firefox/i.test(ua) ? '火狐浏览器' : /Safari/i.test(ua) ? 'Safari浏览器' : ''
  return br ? os + ' · ' + br : os
}

async function loadChipLogs(){
  const r = await fetch('/api/admin/chip-logs', { headers: headers() })
  if (r.status === 401) { location.reload(); return }
  const d = await r.json()
  const logs = d.logs || []
  $('chipEmpty').style.display = logs.length ? 'none' : ''
  $('chipRows').innerHTML = logs.map(g =>
    '<tr>' +
    '<td class="stats">' + fmtTime(g.created_at) + ' ' + (g.created_at ? new Date(g.created_at).toTimeString().slice(0,8) : '') + '</td>' +
    '<td><b>' + esc(g.username) + '</b></td>' +
    '<td class="chips" style="color:' + (g.change >= 0 ? '#4ade80' : '#f87171') + '">' + (g.change >= 0 ? '+' : '') + fmt(g.change) + '</td>' +
    '<td class="chips">' + fmt(g.balance_after) + '</td>' +
    '<td class="stats">' + esc(g.reason) + '</td>' +
    '<td class="stats">' + esc(g.detail || '-') + '</td>' +
    '</tr>'
  ).join('')
}

async function createUser(){
  const body = { username: $('nu').value.trim(), password: $('np').value, chips: Number($('nc').value) || 50000 }
  if (!body.username || !body.password) { show('createMsg', false, '请填写账户名和密码'); return }
  const r = await fetch('/api/admin/users', { method:'POST', headers: headers(), body: JSON.stringify(body) })
  const d = await r.json()
  if (!r.ok) { show('createMsg', false, d.error || '创建失败'); return }
  show('createMsg', true, '账号 ' + body.username + ' 创建成功')
  $('nu').value = ''; $('np').value = ''
  refresh()
}

async function resetPw(id, name){
  const p = prompt('为账号「' + name + '」设置新密码（至少4位）：')
  if (!p) return
  const r = await fetch('/api/admin/users/' + id + '/password', { method:'POST', headers: headers(), body: JSON.stringify({ password: p }) })
  const d = await r.json()
  show('listMsg', r.ok, r.ok ? '密码已更新' : (d.error || '操作失败'))
}

async function setChips(id, name, cur){
  const v = prompt('账号「' + name + '」的筹码，当前 ' + fmt(cur) + '，输入新数值：', cur)
  if (v === null) return
  const r = await fetch('/api/admin/users/' + id + '/chips', { method:'POST', headers: headers(), body: JSON.stringify({ chips: Number(v) }) })
  const d = await r.json()
  show('listMsg', r.ok, r.ok ? '筹码已更新' : (d.error || '操作失败'))
  if (r.ok) refresh()
}

async function delUser(id, name){
  if (!confirm('确定删除账号「' + name + '」？此操作不可恢复。')) return
  const r = await fetch('/api/admin/users/' + id, { method:'DELETE', headers: headers() })
  show('listMsg', r.ok, r.ok ? '已删除' : '删除失败')
  if (r.ok) refresh()
}

if (pw()) { $('pw').value = pw(); load() }
</script>
</body>
</html>`
