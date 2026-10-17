/* ============ gifts.js — 管理員發放金幣／抽獎券 ============
 * 管理員在「排行榜管理 → 發放」輸入玩家暱稱與數量，禮物寫進
 * gifts/{uid}/items；玩家登入、回到選單或分頁回來時自動領取。
 * 入帳走遊戲原本的存檔與帳本（save.coins / save.tickets），所以
 * 下次和其他裝置合併時不會被蓋掉。
 */
G.Gifts = (() => {
  const num = v => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0);
  let busy = false, last = 0;

  function fb() { return (G.DB && G.DB.online) ? G.DB.fb : null; }
  function items(uid) { return fb().fs.collection('gifts').doc(uid).collection('items'); }

  async function uidOfName(name) {
    const f = fb(); if (!f) return null;
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    const d = await f.fs.collection('names').doc(key).get();
    return d.exists ? d.data().uid : null;
  }

  async function balanceOf(uid) {
    const f = fb(); if (!f) return null;
    const d = await f.fs.collection('saves').doc(uid).get();
    if (!d.exists) return null;
    const s = d.data().save || {};
    return { c: num(s.coins), t1: num((s.tickets || {}).t1), t10: num((s.tickets || {}).t10) };
  }

  async function send(toUid, { c = 0, t1 = 0, t10 = 0, note = '' } = {}) {
    const f = fb(); if (!f) throw { code: 'not-online' };
    const data = {
      c: num(c), t1: num(t1), t10: num(t10),
      from: f.uid,
      at: firebase.firestore.FieldValue.serverTimestamp(),
      claimed: false
    };
    if (note) data.note = String(note).slice(0, 40);
    await f.fs.collection('gifts').doc(toUid).collection('items').add(data);
  }

  async function claim() {
    const f = fb();
    if (!f || busy || !G.DB.save) return 0;
    busy = true;
    try {
      const q = await items(f.uid).where('claimed', '==', false).limit(50).get();
      if (q.empty) return 0;
      const sv = G.DB.save;
      let c = 0, t1 = 0, t10 = 0;
      const batch = f.fs.batch();
      q.docs.forEach(d => {
        const v = d.data() || {};
        c += num(v.c); t1 += num(v.t1); t10 += num(v.t10);
        batch.update(d.ref, { claimed: true, claimedAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
      if (c || t1 || t10) {
        sv.coins = num(sv.coins) + c;
        sv.tickets = sv.tickets || { t1: 0, t10: 0 };
        sv.tickets.t1 = num(sv.tickets.t1) + t1;
        sv.tickets.t10 = num(sv.tickets.t10) + t10;
        G.DB.commit(true);
        if (G.UI) {
          G.UI.refreshCoins();
          const p = [];
          if (c) p.push(c + ' 金幣');
          if (t1) p.push(t1 + ' 張 ×1 券');
          if (t10) p.push(t10 + ' 張 ×10 券');
          G.UI.toast('管理員發放：' + p.join('、'), 5000);
        }
      }
      await batch.commit();
      return q.size;
    } catch (e) {
      console.warn('[Gifts]', e.code || e.message);
      return 0;
    } finally { busy = false; }
  }

  function tick() {
    if (document.hidden || !G.DB || !G.DB.online || !G.Game || G.Game.state !== 'ui') return;
    if (Date.now() - last < 30000) return;
    last = Date.now();
    claim();
  }

  function start() {
    setInterval(tick, 60000);
    document.addEventListener('visibilitychange', tick);
  }

  return { uidOfName, balanceOf, send, claim, start };
})();
