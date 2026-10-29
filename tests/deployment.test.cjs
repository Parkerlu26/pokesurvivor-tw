const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function runtimeConfig() {
  const context = { window: {} };
  vm.runInNewContext(read('js/firebase-config.runtime.js'), context);
  return context.window.PS_FIREBASE_CONFIG;
}

test('private fork never schedules the upstream YouTube publishing job', () => {
  const workflow = read('.github/workflows/live.yml');
  assert.ok(!/^\s+(schedule|cron):/m.test(workflow), 'Remove the inherited cron; forks have no live branch');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /if:\s*github\.repository\s*==\s*'JPTER78\/pokesurvivor'/);
  assert.match(read('js/ui/live-ui.js'), /raw\.githubusercontent\.com\/JPTER78\/pokesurvivor\/live\/live\.json/);
});

test('Firebase CLI deploys to the same private project as the running game', () => {
  const config = runtimeConfig();
  assert.ok(config?.projectId);
  assert.notEqual(config.projectId, 'pokesurvivor-free');
  assert.equal(JSON.parse(read('.firebaserc')).projects.default, config.projectId);
  assert.ok(config.authDomain.startsWith(config.projectId + '.'));
  assert.ok(new URL(config.databaseURL).hostname.startsWith(config.projectId + '-'));
});

test('GitHub Pages does not claim the upstream custom domain', () => {
  assert.equal(fs.existsSync(path.join(root, 'CNAME')), false, 'This fork uses parkerlu26.github.io, not the upstream CNAME');
  for (const file of ['dev.html', 'index.html']) {
    assert.match(read(file), /rel="canonical" href="https:\/\/parkerlu26\.github\.io\/pokesurvivor-tw\/"/);
  }
});

test('Firestore long-polling settings preserve the existing SDK host', () => {
  const statement = read('js/core/db.js').match(/fs\.settings\(\{[^}]*experimentalAutoDetectLongPolling[^}]*\}\)/)?.[0];
  assert.ok(statement, 'Cloud initialization must configure long polling');
  let settings = { host: 'firestore.googleapis.com' };
  new Function('fs', statement)({ settings(next) { settings = next.merge ? { ...settings, ...next } : next; } });
  assert.equal(settings.host, 'firestore.googleapis.com', 'Use merge:true instead of replacing all SDK settings');
  assert.equal(settings.experimentalAutoDetectLongPolling, true);
});

test('published bundle and CSS match version.json and index.html', () => {
  const digest = crypto.createHash('sha1').update(read('js/app.min.js')).update(read('css/style.css')).digest('hex').slice(0, 10);
  assert.equal(JSON.parse(read('version.json')).v, digest);
  assert.ok(read('index.html').includes('js/app.min.js?v=' + digest));
  assert.ok(read('index.html').includes('src="js/firebase-config.runtime.js"'));
});

test('Firebase deployment includes rules and the leaderboard collection-group index', () => {
  const config = JSON.parse(read('firebase.json'));
  assert.equal(config.firestore.rules, 'firestore.rules');
  assert.equal(config.firestore.indexes, 'firestore.indexes.json');
  assert.equal(config.database.rules, 'database.rules.json');
  const indexes = JSON.parse(read(config.firestore.indexes));
  assert.ok(indexes.fieldOverrides.some(x => x.collectionGroup === 'e' && x.fieldPath === 'uids' &&
    x.indexes.some(i => i.arrayConfig === 'CONTAINS' && i.queryScope === 'COLLECTION_GROUP')));
});

test('published bundle contains the corrected private-server save notice', () => {
  const bundle = read('js/app.min.js');
  assert.ok(bundle.includes('ps.savenote.tw.manual.20261025'), 'Rebuild after changing the notice');
  assert.ok(bundle.includes('沒有定時上傳，關閉分頁也不會自動上傳'));
  assert.ok(!bundle.includes('關閉分頁時也會上傳'));
});

test('client admin UIDs match the Firestore moderation rule', () => {
  const client = read('js/net/ranking.js').match(/const ADMINS = (\[[^;]+\])/)?.[1];
  const rule = read('firestore.rules').match(/function admin\(\)[^\n]+me\(\) in (\[[^;]+\])/)?.[1];
  assert.ok(client && rule);
  const parse = text => JSON.parse(text.replace(/'/g, '"')).sort();
  assert.deepEqual(parse(client), parse(rule));
});

test('mobile gacha panels can shrink inside the responsive grid', () => {
  assert.match(read('css/style.css'), /#scr-gacha\s+\.split\s*>\s*\*\s*\{\s*min-width:\s*0\s*;/,
    'Grid children need min-width:0 so all gacha text and pull buttons fit on mobile');
});

test('privacy notice does not promise persistent progress for guest sessions', () => {
  const privacy = read('privacidad/index.html');
  assert.ok(privacy.includes('訪客進度只在本次遊玩期間保留'));
  assert.ok(!privacy.includes('進度與偏好保存在你使用的瀏覽器'));
});
