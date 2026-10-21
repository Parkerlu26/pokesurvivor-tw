/* 繁中私人副本：把遊戲語言固定為繁體中文（上游 2026-10-20 起原生支援 zh-Hant）。
   必須在 js/core/locales.js 之前執行——locales.js 會讀 localStorage.ps.lang 決定要
   下載哪一包字典（js/lang/zh-Hant.js）。改放在外部檔案以符合 CSP（不可用 inline script）。 */
try { localStorage.setItem('ps.lang', 'zh-Hant'); } catch (e) {}
