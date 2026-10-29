/* ============ login.js — inicio: entrar, crear cuenta o invitado ============ */
G.LoginUI = (() => {
  const $ = G.UI.$;
  let mode = 'login';

  function init() {
    document.querySelectorAll('#scr-login .tab').forEach(t => {
      t.onclick = () => setMode(t.dataset.tab);
    });
    $('login-form').onsubmit = async e => {
      e.preventDefault();
      $('login-err').textContent = '';
      $('btn-auth').disabled = true;
      const fn = mode === 'login' ? G.DB.login : G.DB.register;
      const r = await fn($('f-user').value, $('f-pass').value);
      $('btn-auth').disabled = false;
      if (!r.ok) { $('login-err').textContent = r.error; return; }
      $('f-pass').value = '';
      G.Flow.afterLogin();
    };
    $('btn-guest').onclick = () => { G.DB.playAsGuest(); G.Flow.afterLogin(); };
    $('f-forgot').onclick = e => {
      e.preventDefault();
      $('login-err').textContent = '';
      $('forgot-note').classList.toggle('hidden');
    };
    // Vincular Gmail para poder recuperar la cuenta (ver offerRecovery).
    $('rec-link').onclick = async () => {
      $('rec-err').textContent = '';
      $('rec-link').disabled = true;
      const r = await G.DB.linkGoogle();
      $('rec-link').disabled = false;
      if (!r.ok) { $('rec-err').textContent = r.error; return; }
      $('scr-recover').classList.add('hidden');
      G.UI.toast('¡Gmail vinculado! Si olvidas la contraseña, entra con Google.', 4500);
    };
    $('rec-later').onclick = () => $('scr-recover').classList.add('hidden');
    $('rec-never').onclick = () => {
      try { localStorage.setItem('ps.recover.no.' + G.DB.fb.uid, '1'); } catch (e) { /* nada */ }
      $('scr-recover').classList.add('hidden');
    };
    $('btn-google').onclick = async () => {
      $('login-err').textContent = '';
      $('btn-google').disabled = true;
      const r = await G.DB.loginWithGoogle();
      $('btn-google').disabled = false;
      if (!r.ok) { $('login-err').textContent = r.error; return; }
      G.Flow.afterLogin();
    };
  }

  /**
   * Al entrar (o recién creada la cuenta) con nombre y contraseña, si aún no
   * hay Gmail vinculado: "¿te da miedo perder tu cuenta?". Una vez por sesión,
   * hasta que lo vincule o diga que no le vuelvan a preguntar.
   */
  let offered = false;
  function offerRecovery() {
    if (offered || G.DB.mode !== 'cloud' || !G.DB.fb || !G.DB.nameAccount || G.DB.hasGoogle) return;
    try { if (localStorage.getItem('ps.recover.no.' + G.DB.fb.uid)) return; } catch (e) { /* nada */ }
    offered = true;
    $('rec-err').textContent = '';
    $('scr-recover').classList.remove('hidden');
  }

  /*
   * Avisos de una actualización: cada uno sale una vez por navegador, la
   * primera vez que se entra al menú después de subirla; si hay varios,
   * uno tras otro. Para uno nuevo, se añade aquí con su propia clave.
   */
  const cloud = () => G.DB.mode === 'cloud' && !G.DB.guest;
  const NOTES = [
    { key: 'ps.savenote.tw.manual.20261025', when: cloud,              // 私人副本：重新提示手動雲端存檔，不能保證關閉分頁會上傳
      title: ['重要：請記得儲存進度', '重要：請記得儲存進度'],
      body: ['<p>進度會先保存在這台裝置的瀏覽器。雲端存檔需要<b>手動按右上角的儲存按鈕</b>；沒有定時上傳，關閉分頁也不會自動上傳。</p>' +
             '<p>右上角新增了 <b class="gold">儲存</b> 按鈕。關閉遊戲或換裝置前請先按一下：<b>這對避免進度遺失非常重要</b>。</p>',
             '<p>進度會先保存在這台裝置的瀏覽器。雲端存檔需要<b>手動按右上角的儲存按鈕</b>；沒有定時上傳，關閉分頁也不會自動上傳。</p>' +
             '<p>右上角新增了 <b class="gold">儲存</b> 按鈕。關閉遊戲或換裝置前請先按一下：<b>這對避免進度遺失非常重要</b>。</p>'] },
    { key: 'ps.ranknote.1', when: () => cloud() && ((G.DB.save.stats || {}).runs || 0) > 0,   // rankings desde cero (18-10-2026)
      title: ['排行榜已重新開始', '排行榜已重新開始'],
      body: ['<p>我們調整了 <b>阿爾宙斯的審判</b>：靠速度逃跑和中毒已經無法一直撐下去。</p>' +
             '<p>為了讓大家在相同條件下競爭，<b>所有排行榜都從零開始</b>（今日、本週、本月、今年與歷史）。快去搶第一名吧！</p>',
             '<p>我們調整了 <b>阿爾宙斯的審判</b>：靠速度逃跑和中毒已經無法一直撐下去。</p>' +
             '<p>為了讓大家在相同條件下競爭，<b>所有排行榜都從零開始</b>（今日、本週、本月、今年與歷史）。快去搶第一名吧！</p>'] }
  ];
  /** → true si se ha enseñado alguno. */
  function updateNotices() {
    const queue = NOTES.filter(n => { try { return n.when() && !localStorage.getItem(n.key); } catch (e) { return false; } });
    if (!queue.length) return false;
    const en = G.I18n.lang === 'en' ? 1 : 0;
    const next = () => {
      const n = queue.shift();
      if (!n) { $('scr-savenote').classList.add('hidden'); return; }
      try { localStorage.setItem(n.key, '1'); } catch (e) { /* nada */ }
      $('savenote-title').textContent = n.title[en];
      // Otros idiomas: el aviso entero va traducido en su diccionario (por trozos sale raro); si falta, en inglés.
      const other = G.I18n.lang !== 'es' && !en, body = $('savenote-body');
      if (other) body.setAttribute('translate', 'no');
      body.innerHTML = !other ? n.body[en] : G.I18n.has(n.body[0]) ? G.T(n.body[0]) : n.body[1];
      // 繁中私人副本：字典沒有「Entendido」，這裡直接給中文。
      $('savenote-ok').textContent = G.I18n.lang === 'zh-Hant' ? '知道了' : (en ? 'Got it' : 'Entendido');
    };
    $('savenote-ok').onclick = next;
    next();
    $('scr-savenote').classList.remove('hidden');
    return true;
  }

  /** Explica dónde se guarda la partida según el modo de la base de datos. */
  function modeNote() {
    if (G.DB.mode === 'cloud') return 'Tu partida se guarda en la nube: entra desde cualquier ordenador. Como invitado no se guarda.';
    const why = G.DB.localReason === 'file'
      ? 'Abierto desde un archivo: la partida sólo se guarda en este navegador. Para guardar en la nube, juega en la versión publicada.'
      : G.DB.localReason === 'host'
        ? '此副本未連上雲端：進度只會存在這個瀏覽器。'
      : G.DB.localReason === 'dev'
        ? '測試頁面：進度只會存在這個瀏覽器。請開啟此副本的首頁以使用雲端存檔。'
      : G.DB.localReason === 'config'
        ? 'Nube sin configurar: la partida sólo se guarda en este navegador.'
        : 'No se pudo conectar con la nube: la partida sólo se guarda en este navegador.';
    return why;
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('#scr-login .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === m));
    $('btn-auth').textContent = m === 'login' ? 'Entrar' : 'Crear cuenta';
    $('f-pass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('login-err').textContent = '';
  }

  function open() {
    G.UI.chrome(false);
    G.UI.show('scr-login');
    if (!G.DB.storageOk) $('login-err').textContent = 'Este navegador no deja guardar datos: juega como invitado.';
    $('btn-google').classList.toggle('hidden', G.DB.mode !== 'cloud');
    $('login-mode').textContent = modeNote();
    setTimeout(() => $('f-user').focus(), 50);
  }

  return { init, open, offerRecovery, updateNotices };
})();
