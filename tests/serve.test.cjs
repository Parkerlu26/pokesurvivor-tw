const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const server = require('../tools/serve.cjs');

test('local preview serves the game but hides repository metadata', async t => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  for (const file of ['/', '/dev.html', '/version.json', '/js/app.min.js', '/js/firebase-config.runtime.js']) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200, file); await response.arrayBuffer();
  }
  for (const file of ['/.git/config', '/.firebaserc', '/.github/workflows/live.yml', '/%2egit/config', '/missing-file']) {
    const response = await fetch(base + file);
    assert.equal(response.status, 404, file); await response.text();
  }
  const post = await fetch(base + '/', { method: 'POST' });
  assert.equal(post.status, 405);
});
