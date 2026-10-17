/* ============ mod-ui.js — moderación del ranking (pantalla oculta) ============
 * Sólo la ve la cuenta de moderación (G.Ranking.isAdmin, y firestore.rules
 * admin(): aunque alguien abriera esta pantalla, el servidor no le dejaría
 * hacer nada). Se abre con el botón "Moderación" del ranking.
 *
 *   Reportes          marcas reportadas por los jugadores, las más reportadas
 *                     primero: borrar la marca, banear (no puede volver a
 *                     subir marcas, y se borra su marca de todas las tablas de
 *                     ahora) o descartar el reporte.
 *   Baneados          las cuentas baneadas del ranking; se pueden desbanear.
 */
G.ModUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = 'rep';

  function init() {
    $('mod-back').onclick = () => G.RankingUI.open();
    $('mod-purge').onclick = async () => {
      if (!confirm('¿Quitar del ranking TODAS las marcas de más de 1 hora (todas las tablas)? No se puede deshacer.')) return;
      const b = $('mod-purge');
      b.disabled = true;
      try {
        const r = await G.Ranking.purgeAbove(3600, (i, n) => { b.textContent = 'Revisando ' + i + ' / ' + n + '…'; });
        G.UI.toast('Quitadas ' + r.rows + ' marcas de más de 1 hora (' + r.boards + ' tablas)', 5000);
      } catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message), 5000); }
      b.disabled = false; b.textContent = 'Quitar marcas de más de 1 hora';
      render();
    };
    $('gift-send').onclick = sendGift;
    $('dex-unlock').onclick = () => unlockDex(false);
    $('dex-unlock-shiny').onclick = () => unlockDex(true);
    document.querySelectorAll('#mod-tabs .tab').forEach(t => { t.onclick = () => { tab = t.dataset.tab; render(); }; });
  }

  /** 管理員：把自己存檔的圖鑑全部解鎖（只影響自己的帳號）。 */
  function unlockDex(withShiny) {
    if (!G.Ranking.isAdmin()) return;
    const s = G.DB.save;
    if (!s) return;
    if (!confirm(withShiny ? '確定要解鎖全部一般＋閃光寶可夢嗎？' : '確定要解鎖全部一般寶可夢嗎？')) return;
    const msg = $('dex-msg');
    const now = Date.now();
    let n = 0, sh = 0;
    s.owned = s.owned || {};
    s.shiny = s.shiny || {};
    for (const p of G.DEX) {
      if (!s.owned[p.dex]) { s.owned[p.dex] = { at: now, from: 'admin' }; n++; }
      if (withShiny && !s.shiny[p.dex]) { s.shiny[p.dex] = { at: now, from: 'admin' }; sh++; }
    }
    G.DB.commit(true);
    msg.textContent = '已解鎖 ' + n + ' 隻一般寶可夢' + (withShiny ? '、' + sh + ' 隻閃光' : '') + '。';
    if (G.UI) G.UI.toast('圖鑑已更新', 3000);
  }

  /** 管理員：把金幣／抽獎券放進玩家的禮物箱。 */
  async function sendGift() {
    const msg = $('gift-msg'), b = $('gift-send');
    const name = $('gift-name').value.trim();
    const c = Math.max(0, Math.floor(+$('gift-coins').value || 0));
    const t1 = Math.max(0, Math.floor(+$('gift-t1').value || 0));
    const t10 = Math.max(0, Math.floor(+$('gift-t10').value || 0));
    if (!name) { msg.textContent = '請先輸入玩家暱稱。'; return; }
    if (!c && !t1 && !t10) { msg.textContent = '至少填一項數量大於 0。'; return; }
    b.disabled = true; msg.textContent = '查詢玩家…';
    try {
      const uid = await G.Gifts.uidOfName(name);
      if (!uid) { msg.textContent = '找不到「' + name + '」，暱稱要和遊戲裡完全一樣。'; return; }
      const cur = await G.Gifts.balanceOf(uid).catch(() => null);
      await G.Gifts.send(uid, { c, t1, t10, note: $('gift-note').value.trim() });
      msg.textContent = '已發放給 ' + name + (cur ? '（目前 ' + cur.c + ' 金幣、' + cur.t1 + ' 張 ×1、' + cur.t10 + ' 張 ×10）' : '') + '。對方下次登入或回選單時會自動領取。';
      $('gift-coins').value = 0; $('gift-t1').value = 0; $('gift-t10').value = 0; $('gift-note').value = '';
    } catch (e) {
      msg.textContent = '發放失敗：' + (e.code || e.message || e);
    } finally { b.disabled = false; }
  }

  function open() {
    if (!G.Ranking.isAdmin()) return;
    G.UI.show('scr-mod', true);
    render();
  }

  const fmt = t => G.U.mmss(t || 0);
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn small ' + cls; b.textContent = label; b.onclick = fn; return b; };

  async function render() {
    document.querySelectorAll('#mod-tabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    const gift = tab === 'gift', tools = tab === 'tools';
    $('mod-list').classList.toggle('hidden', gift || tools);
    $('mod-gift').classList.toggle('hidden', !gift);
    $('mod-tools').classList.toggle('hidden', !tools);
    $('mod-purge').classList.toggle('hidden', gift || tools);
    if (gift) { $('gift-msg').textContent = ''; return; }
    if (tools) { $('dex-msg').textContent = ''; return; }
    const list = $('mod-list');
    list.innerHTML = '<p class="sub">Cargando…</p>';
    try {
      if (tab === 'rep') await renderReports(list);
      else await renderMarked(list);
    } catch (e) {
      list.innerHTML = '<p class="sub">No se pudo cargar (' + esc(e.code || e.message) + ').</p>';
    }
  }

  /** "s_w2026-42" -> "Solo · Semana" */
  function boardName(b) {
    const [m, p] = b.split('_');
    const mode = m === 'g' ? 'Grupo' : 'Solo';
    const per = p.startsWith('d') ? 'Hoy' : p.startsWith('w') ? 'Semana' : p.startsWith('m') ? 'Mes' : 'Histórico';
    const dex = (b.match(/_p(\d+)$/) || [])[1];
    return mode + ' · ' + per + (dex && G.DEX_BY[dex] ? ' · sólo ' + G.DEX_BY[dex].name : '');
  }
  // Con la Sentencia de Arceus (minuto 30) casi nadie pasa de ~32-33 min.
  const SUSPECT_T = 33 * 60;

  async function renderReports(list) {
    const groups = await G.Ranking.reports();
    list.innerHTML = groups.length ? '' : '<p class="sub">No hay reportes.</p>';
    for (const g of groups) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row rep';
      const mode = g.board.startsWith('g_') ? 'g' : 's';
      // Lo que se ve de la marca ahora en su tabla (nivel, derrotados, Pokémon).
      const info = await G.Ranking.entryInfo(g.board, g.e).catch(() => null);
      const t = info ? info.t : g.t;
      const sus = t > SUSPECT_T;
      const mons = document.createElement('span');
      mons.className = 'mons';
      if (info) info.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!(info.shiny || [])[i] })); });
      row.innerHTML = `<span class="pos" title="veces reportada">${g.n}×</span>`;
      row.appendChild(mons);
      row.insertAdjacentHTML('beforeend', `<span class="who"><b translate="no">${g.names.map(esc).join(' · ')}</b>
          <small>${esc(boardName(g.board))}${info ? ' · Nv. ' + (info.lv || 1) + ' · ' + (info.kills || 0).toLocaleString('es') + ' derrotados' : ' · ya no está en el top 50'}</small>
          ${sus ? '<small class="mod-warn">Más de 33 min: casi imposible con la Sentencia de Arceus</small>' : ''}</span>
        <span class="time${sus ? ' mod-warn' : ''}">${fmt(t)}</span>`);
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      const busy = async (fn, msg) => {
        acts.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try { await fn(); G.UI.toast(msg); row.remove(); }
        catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message)); acts.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
      };
      acts.append(
        btn('Borrar marca', 'ghost', () => busy(async () => {
          await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
          await G.Ranking.dismiss(g.ids);
        }, 'Marca borrada')),
        btn('Banear', 'danger', () => {
          if (!confirm('¿Banear a ' + g.names.join(', ') + '? No podrán volver a salir en el ranking y se borra su marca.')) return;
          busy(async () => {
            const uids = g.e.split('_');
            for (const u of uids) await G.Ranking.setMarked(u, true).catch(() => {});
            await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
            await G.Ranking.dismiss(g.ids);
          }, 'Baneado');
        }),
        btn('Descartar', 'ghost', () => busy(() => G.Ranking.dismiss(g.ids), 'Reporte descartado'))
      );
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  async function renderMarked(list) {
    const accs = await G.Ranking.markedAccounts();
    list.innerHTML = accs.length ? '' : '<p class="sub">No hay cuentas baneadas.</p>';
    for (const a of accs) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row';
      row.innerHTML = `<span class="pos"></span>
        <span class="who"><b translate="no">${esc(a.name)}</b><small translate="no">${a.coins.toLocaleString('es')} monedas · ${a.t1} tickets · ${a.t10} ×10 · ${a.owned} Pokémon · ${esc(a.uid)}</small></span>`;
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      acts.append(btn('Desbanear', 'ghost', async () => {
        try { await G.Ranking.setMarked(a.uid, false); G.UI.toast('Desbaneada'); row.remove(); }
        catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message)); }
      }));
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  return { init, open };
})();
