const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = path.join(__dirname, '..', 'js/ui/video-ui.js');
const ID = 'abcdefghijk';

async function env({ notice, state = 'ui', menu = true } = {}) {
  const now = Date.now(), store = new Map(), intervals = [], requests = [], music = [], opened = [];
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'video-play' ? [] : ['hidden']);
      nodes.set(id, { innerHTML: '', classList: { contains: x => classes.has(x),
        add: x => classes.add(x), remove: x => classes.delete(x) } });
    }
    return nodes.get(id);
  };
  const document = { hidden: false, activeElement: null, busy: false,
    querySelector: () => document.busy || !node('scr-video').classList.contains('hidden') ? {} : null };
  const G = { Game: { state }, UI: { $: node, isOpen: () => menu },
    Audio: { track: 'menu-theme', music: x => music.push(x) } };
  const ctx = { G, document, Date, console,
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    window: { open: (...args) => opened.push(args) },
    fetch: async (url, options) => { requests.push([url, options]); return { ok: true, json: async () => notice || {
      id: ID, desde: new Date(now - 60000).toISOString(), hasta: new Date(now + 60000).toISOString() } }; },
    setInterval: (fn, ms) => intervals.push([fn, ms]) };
  vm.runInNewContext(fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '', ctx);
  assert.ok(G.VideoUI, 'the recovered public video notification module exists');
  G.VideoUI.init();
  await new Promise(resolve => setImmediate(resolve));
  const poll = () => intervals.find(([, ms]) => ms === 2000)[0]();
  return { G, node, document, requests, music, opened, store, poll };
}

test('new-video notice: a valid public announcement appears once in the idle menu', async () => {
  const x = await env(); x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), false);
  assert.ok(x.node('video-thumb').innerHTML.includes('https://i.ytimg.com/vi/' + ID));
  assert.equal(x.requests[0][0], 'https://raw.githubusercontent.com/JPTER78/pokesurvivor/live/aviso.json');
  assert.equal(x.requests[0][1].headers, undefined, 'no private credentials are sent');
  x.node('video-close').onclick(); x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
  assert.ok([...x.store.values()].includes(ID));
});

test('new-video notice: never interrupts a run, focused inputs, other modals or gacha animations', async () => {
  const x = await env({ state: 'run' }); x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
  x.G.Game.state = 'ui'; x.document.activeElement = { tagName: 'INPUT' }; x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
  x.document.activeElement = null; x.document.busy = true; x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
  x.document.busy = false; x.node('pull-fx').classList.remove('hidden'); x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
  x.node('pull-fx').classList.add('hidden'); x.poll();
  assert.equal(x.node('scr-video').classList.contains('hidden'), false);
});

test('new-video notice: expired announcements and invalid video IDs are rejected', async () => {
  for (const notice of [{ id: ID, desde: '2000-01-01', hasta: '2000-01-02' },
    { id: 'x"><script>', desde: '2000-01-01', hasta: '2100-01-01' }]) {
    const x = await env({ notice }); x.poll();
    assert.equal(x.node('scr-video').classList.contains('hidden'), true);
    assert.equal(x.node('video-thumb').innerHTML, '');
  }
});

test('new-video notice: embedded playback pauses music and closing restores it', async () => {
  const x = await env(); x.poll(); x.node('video-play').onclick();
  assert.ok(x.node('video-thumb').innerHTML.includes('https://www.youtube.com/embed/' + ID));
  assert.deepEqual(x.music, [null]);
  x.node('video-close').onclick();
  assert.equal(x.node('video-thumb').innerHTML, '');
  assert.deepEqual(x.music, [null, 'menu-theme']);
});

test('new-video notice: YouTube button opens only the validated video and closes the dialog', async () => {
  const x = await env(); x.poll(); x.node('video-yt').onclick();
  assert.deepEqual(x.opened, [['https://www.youtube.com/watch?v=' + ID, '_blank', 'noopener']]);
  assert.equal(x.node('scr-video').classList.contains('hidden'), true);
});
