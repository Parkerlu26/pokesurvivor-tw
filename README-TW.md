# PokéSurvivor 繁體中文私人副本

這是 [JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor) 的私人自架副本，
只供朋友之間免費遊玩。**不是官方網站，也沒有任何收費、廣告或贊助入口。**

- 線上遊玩：<https://parkerlu26.github.io/pokesurvivor-tw/>
- 原始專案與官方網站：<https://github.com/JPTER78/pokesurvivor> · <https://pokesurvivor.com/>

## 這個副本改了什麼

1. **繁體中文**：內嵌 Greasy Fork 的「PokéSurvivor 繁體中文補丁」v1.3.3（MIT 授權，
   版權與授權文字保留在 `js/zh-hant.js` 檔頭），並移除「只能跑在官方網域」的限制。
   `js/tw-init.js` 在載入遊戲前選擇上游原生 `zh-Hant` 字典，舊補丁保留作為補充翻譯。
2. **Firebase**：改用 `js/firebase-config.runtime.js` 的執行期設定，不把任何專案設定
   寫死在打包後的程式裡。留 `null` 就是只存本機（單人可玩）。
3. **多人連線**：把作者關掉的 Realtime Database 中繼打開（`js/net/net.js` 的
   `ALLOW_RELAY = true`），WebRTC 直連失敗時會改走 Firebase 中繼，並消耗 RTDB 用量。
   `TURN_ON = false`，不把本副本玩家的 token 傳到作者的 TURN 伺服器。
4. **網域相關**：移除 `CNAME`、把 canonical／分享連結改指這個網站、移除作者的贊助入口。
5. 以 `node tools/build.js --expose` 建置（不混淆、保留 `G`），方便除錯。

## 本機專案位置

本專案已移至：`C:\Users\nicwe\antigravity\poke`。

```powershell
Set-Location -LiteralPath 'C:\Users\nicwe\antigravity\poke'
node tools/serve.cjs 8081
```

Git 倉庫與遠端設定保留不變。補丁、驗證副本與部署紀錄收在 `.local-delivery`，不會納入 Git。
詳見 [本機工作區說明](docs/WORKSPACE.md)。

## 部署檢查與本機預覽

2026-10-25 的問題、已修正項目與上線步驟見 [檢查報告](docs/DIAGNOSTICS-2026-10-25.md)。

```bash
node tools/serve.cjs 8081
```

開啟 `http://127.0.0.1:8081/`。伺服器只監聽本機，這不是公開部署服務。

```bash
node --test tests/deployment.test.cjs tests/i18n.test.cjs tests/net.test.cjs tests/serve.test.cjs
```

如果受限環境不允許 Node 建立測試子程序，可以加上 `--test-isolation=none`。

「私人副本」代表獨立自架，不等於網站有門禁；目前 GitHub Pages 網址仍是公開的。
要做到只有指定朋友能進入，需要另行加入真正的網站存取控制與後端成員驗證。

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
6. Authentication → 設定 → 授權網域 → 加入 `parkerlu26.github.io`、`localhost`；本機用 IP 測試時也加入 `127.0.0.1`。
7. `.firebaserc` 必須和 runtime 設定的 `projectId` 相同，目前是 `pokesurvivor-tw-6b55e`；不要部署到作者的 `pokesurvivor-free`。
8. 除了資料庫規則，也必須部署 `firestore.indexes.json` 的排行榜索引。
9. 改完 `js/firebase-config.runtime.js` 直接 commit／push 即可，**不必重新建置**。

目前雲端存檔是手動操作：關閉遊戲或換裝置前按右上角「儲存」，並等到儲存完成。
沒有定時上傳，關閉分頁也不會自動上傳。

## 本次同步：2026-10-30

- 原版公開分支：`110550a80f81eadd6924b6286807935a479e9b4f`（2026-10-29）。
- 最新完整公開客戶端原始碼：`d667c216`（2026-10-28）；同步萬聖節（10/30–11/2，西班牙時間）、存檔合併、合作慢速連線與手機操作修正。
- 10/29 原版移除了開發原始碼、工具與伺服器規則，故保留最新可取得的原始碼，另外接上最新公開的隱私政策、直播檢查程式與影片通知（從公開成品恢復對應模組，並補回歸測試）。不是直接刪除本副本的開發／部署檔案。
- 原版新增的排行榜 seal 服務不適用私人 Firebase。`window.PS_RANKING_SEAL_API = null` 預設不呼叫官方伺服器，成績沿用本副本的規則；只有架設自己的驗證服務與對應規則後才設定此欄位。
- 更新的合作房間規則使用 `rin` 入場標記與分塊中繼。上線時需要部署 `database.rules.json` 和 `firestore.rules`，否則舊規則可能阻擋入場。
- 同步前檔案、合併來源與測試紀錄在 `.local-delivery/upstream-update-20261030/`。本機更新不會自動推送 GitHub 或部署 Firebase。

```powershell
node tools/build.js --expose
node tools/export_data.js
python tools/make_seo_pages.py
node --test --test-isolation=none tests/*.test.cjs
# 經確認後才部署，不會更改任何玩家存檔內容：
firebase deploy --only firestore:rules,firestore:indexes,database --project pokesurvivor-tw-6b55e
```

## 更新上游

```bash
git remote add upstream https://github.com/JPTER78/pokesurvivor.git
git fetch upstream
# 合併後檢查私人 Firebase / CNAME / live workflow，再建置並執行上面的測試
```

本副本的改動集中在：`dev.html`、`js/zh-hant.js`、`js/firebase-config.runtime.js`、
`js/core/firebase-config.js`、`js/core/db.js`（HOSTS）、`js/ui/login.js`、
`js/data/funding.js`、`js/net/net.js`（ALLOW_RELAY）。

## 授權

程式碼為 PolyForm Noncommercial 1.0.0；寶可夢 sprites 為 CC BY-NC 4.0（見 `CREDITS.md`）；
Pokémon 與相關名稱、角色為 Nintendo、Creatures Inc.、GAME FREAK 與 The Pokémon Company 的商標與財產。
本副本為非商業同人作品，請勿收費、放廣告或公開宣傳。
