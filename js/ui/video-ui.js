/* ============ video-ui.js — aviso de vídeo del canal ============
 * Recovered from upstream public app 110550a8 (2026-10-29), whose source
 * files are no longer published. Matches aviso.json { id, desde, hasta },
 * idle-menu gating, one notice per video, playback and music restoration.
 */
G.VideoUI = (() => {
  const $ = G.UI.$;
  const SRC = 'https://raw.githubusercontent.com/JPTER78/pokesurvivor/live/aviso.json';
  const EVERY = 5 * 60 * 1000, KEY = 'ps.video.seen.tw';
  const validId = id => typeof id === 'string' && /^[\w-]{11}$/.test(id);
  let video = null, lastT = 0, music = null;

  async function check() {
    if (document.hidden || Date.now() - lastT < EVERY - 5000) return;
    lastT = Date.now();
    try {
      const r = await fetch(SRC, { cache: 'no-cache' });
      if (!r.ok) return;
      const d = await r.json(), now = Date.now();
      video = d && validId(d.id) && now >= Date.parse(d.desde) && now < Date.parse(d.hasta) ? d.id : null;
    } catch (e) { /* unavailable notice: keep gameplay independent of the channel */ }
  }

  function idleMenu() {
    if (!G.Game || G.Game.state !== 'ui' || !G.UI.isOpen('scr-menu')) return false;
    if (document.querySelector('.scr.dim:not(.hidden)')) return false;
    const pull = $('pull-fx');
    if (pull && !pull.classList.contains('hidden')) return false;
    const input = document.activeElement;
    return !(input && /^(INPUT|TEXTAREA|SELECT)$/.test(input.tagName));
  }

  function show() {
    if (!video || document.hidden || !idleMenu()) return;
    try { if (localStorage.getItem(KEY) === video) return; } catch (e) { /* storage can be blocked */ }
    try { localStorage.setItem(KEY, video); } catch (e) { /* notice never blocks the game */ }
    $('video-thumb').innerHTML = '<img src="https://i.ytimg.com/vi/' + video + '/hqdefault.jpg" alt="">';
    $('video-play').classList.remove('hidden');
    $('scr-video').classList.remove('hidden');
  }

  function play() {
    if (!validId(video)) return;
    music = G.Audio.track || null;
    G.Audio.music(null);
    $('video-thumb').innerHTML = '<iframe src="https://www.youtube.com/embed/' + video + '?autoplay=1&rel=0" title="YouTube" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    $('video-play').classList.add('hidden');
  }

  function close() {
    $('scr-video').classList.add('hidden');
    $('video-thumb').innerHTML = '';
    if (music) { G.Audio.music(music); music = null; }
  }

  function init() {
    $('video-play').onclick = play;
    $('video-yt').onclick = () => {
      if (validId(video)) window.open('https://www.youtube.com/watch?v=' + video, '_blank', 'noopener');
      close();
    };
    $('video-close').onclick = close;
    check();
    setInterval(check, EVERY);
    setInterval(show, 2000);
  }

  function preview(id) {
    if (!validId(id)) return;
    video = id;
    try { localStorage.removeItem(KEY); } catch (e) { /* no storage */ }
  }

  return { init, preview, close };
})();
