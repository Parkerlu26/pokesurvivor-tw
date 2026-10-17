# PokéSurvivor 繁體中文私人副本

這是 [JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor) 的私人自架副本，
只供朋友之間免費遊玩。**不是官方網站，也沒有任何收費、廣告或贊助入口。**

- 線上遊玩：<https://parkerlu26.github.io/pokesurvivor-tw/>
- 原始專案與官方網站：<https://github.com/JPTER78/pokesurvivor> · <https://pokesurvivor.com/>

## 這個副本改了什麼

1. **繁體中文**：內嵌 Greasy Fork 的「PokéSurvivor 繁體中文補丁」v1.3.3（MIT 授權，
   版權與授權文字保留在 `js/zh-hant.js` 檔頭），並移除「只能跑在官方網域」的限制。
   遊戲語言固定為西班牙文原文，讓補丁的字典能完整覆蓋（補丁同時也認得英文）。
2. **Firebase**：改用 `js/firebase-config.runtime.js` 的執行期設定，不把任何專案設定
   寫死在打包後的程式裡。留 `null` 就是只存本機（單人可玩）。
3. **多人連線**：把作者關掉的 Realtime Database 中繼打開（`js/net/net.js` 的
   `ALLOW_RELAY = true`），WebRTC 直連失敗時會改走 Firebase 免費額度。
4. **網域相關**：移除 `CNAME`、把 canonical／分享連結改指這個網站、移除作者的贊助入口。
5. 以 `node tools/build.js --expose` 建置（不混淆、保留 `G`），方便除錯。

## 重新建置

```bash
node tools/build.js --expose
```

會重新產生 `index.html`、`js/app.min.js` 與 `version.json`。改 `dev.html`，不要改 `index.html`。

## Firebase（4 人合作與雲端存檔用）

1. 到 <https://console.firebase.google.com> 用 Google 帳號建立免費專案（Spark 方案）。
2. Authentication → 啟用「電子郵件/密碼」與「Google」。
3. Firestore Database → 建立資料庫（正式模式）→ 貼上 `firestore.rules` 的內容。
4. Realtime Database → 建立資料庫（`asia-southeast1` 或 `europe-west1`）→ 貼上
   `database.rules.json` 的內容。
5. 專案設定 → 你的應用程式 → 新增 Web 應用程式 → 把 `firebaseConfig` 貼進
   `js/firebase-config.runtime.js`（記得加上 `databaseURL`）。
6. Authentication → 設定 → 授權網域 → 加入 `parkerlu26.github.io` 與 `localhost`。
7. 改完 `js/firebase-config.runtime.js` 直接 commit／push 即可，**不必重新建置**。

## 更新上游

```bash
git remote add upstream https://github.com/JPTER78/pokesurvivor.git
git fetch upstream
# 合併後重新套用本副本的改動，再 node tools/build.js --expose
```

本副本的改動集中在：`dev.html`、`js/zh-hant.js`、`js/firebase-config.runtime.js`、
`js/core/firebase-config.js`、`js/core/db.js`（HOSTS）、`js/ui/login.js`、
`js/data/funding.js`、`js/net/net.js`（ALLOW_RELAY）。

## 授權

程式碼為 PolyForm Noncommercial 1.0.0；寶可夢 sprites 為 CC BY-NC 4.0（見 `CREDITS.md`）；
Pokémon 與相關名稱、角色為 Nintendo、Creatures Inc.、GAME FREAK 與 The Pokémon Company 的商標與財產。
本副本為非商業同人作品，請勿收費、放廣告或公開宣傳。
