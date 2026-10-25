# PokéSurvivor 繁中私人副本檢查報告

檢查日期：2026-10-25（UTC+8）。

## 範圍與結論

- 倉庫：`Parkerlu26/pokesurvivor-tw`，檢查基準為 `474dd19227d58c595b09c73769afef5322d4a671`。
- 上游查詢時最新提交：`d567c6da88e4ef66634ab54a01b5a3607501e03a`；你的分支已包含這次更新。
- 主要郵件來源很可能是繼承的 `live` GitHub Actions，而不是網站部署。尚未取得你的實際郵件內容，所以不把其他類型的通知混為一談。
- 修正在本機完成，**尚未 commit、push 或修改任何 Firebase 雲端設定**。線上的排程不會因本機修改立即停止。

## 1. 已確認：直播排程取出不存在的分支

GitHub API 與公開的執行摘要顯示：

- 2026-10-24 20:08:20 至 2026-10-25 19:56:10（UTC+8），連續 8 次 `live` 排程失敗。
- 最近一次：run `40190939063`，`Run actions/checkout@v4` 失敗，後續 `Mirar el canal` 沒有執行。
- 錯誤註記：`The process '/usr/bin/git' failed with exit code 1`。
- `.github/workflows/live.yml` 原本每 5 分鐘排程一次，並設定 checkout `ref: live`。
- 倉庫分支 API 與本機遠端分支都只有 `main`，沒有 `live`。
- 最近一次 GitHub Pages 部署 `40073832756` 成功。

這些證據定位到「排程 checkout 不存在的 live 分支」，不是 YouTube 抓取錯誤。完整 job log 要 GitHub 登入才可查看；本次沒有取得完整 log。

前端 `js/ui/live-ui.js` 已經直接讀取 **上游** 的 `live/live.json`，因此你的副本沒有必要再抓一次作者的直播狀態。

**本機修正：**移除 schedule，只保留手動觸發，並把工作限制為上游倉庫才執行。不建立多餘的 `live` 分支、不關掉正常的 Pages 部署。

**立即停止錯誤信：**在 GitHub 倉庫的 Actions → live → 右上角「…」→ Disable workflow。這是停用無用的排程，不是把所有錯誤通知靜音。

來源：
- https://github.com/Parkerlu26/pokesurvivor-tw/actions/runs/40190939063
- https://api.github.com/repos/Parkerlu26/pokesurvivor-tw/branches
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows
- https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs

## 2. 已確認：Firebase CLI 專案與遊戲不同

- 遊戲 runtime 設定與實際網頁使用 `pokesurvivor-tw-6b55e`。
- `.firebaserc` 原本仍指向作者的 `pokesurvivor-free`。

這會讓未指定 `--project` 的 CLI 部署用錯專案；若沒有作者的權限，通常會失敗。**不是已證實遊戲正在使用作者資料庫**：網頁 runtime 的專案已是你的專案。

**本機修正：**把 `.firebaserc` 改為 `pokesurvivor-tw-6b55e`。未更換 API key、未搬移帳號、未操作玩家存檔。

## 3. 已確認：CNAME 仍是作者網域

根目錄 `CNAME` 原本為 `pokesurvivor.com`，但你使用的網站是 `parkerlu26.github.io/pokesurvivor-tw/`。

**本機修正：**將原檔保留為 `docs/CNAME.upstream.txt`，根目錄不再宣告作者的自訂網域。

這是部署設定風險，不是目前 Pages 失敗的證據；本次公開 Pages 部署成功且網址可載入。

推送後請確認 Settings → Pages → Custom domain 為空，來源為 `main` / 根目錄。不要填 `parkerlu26.github.io` 當作 Custom domain。

## 4. 已確認：存檔提示與實際行為不符

舊繁中提示承諾「定期上傳、關閉分頁也會上傳」。目前 `js/core/db.js` 的實作卻是：

- 本機進度先存入瀏覽器。
- 按「儲存」、版本更新前 flush、登出時才嘗試上傳。
- 沒有一般進度的定時上傳，也沒有關閉分頁自動上傳。

這容易使玩家換裝置後看到舊雲端存檔。

**本機修正：**改成正確的手動存檔提示，換用新提示 key 讓舊玩家再看到一次提醒，並加上各語系的更新說明。本次沒有偷偷更改上傳頻率或資料合併邏輯。

玩家應在關閉遊戲／切換裝置前按「儲存」，等到完成；如果顯示等待或離線，不要當作已同步。

## 5. 已確認：Firestore SDK 初始化警告

現有網站 console 顯示 Firestore `overriding the original host` 警告。

`fs.settings({ experimentalAutoDetectLongPolling: true })` 原本會替換 SDK 設定。

**本機修正：**改成 `fs.settings({ experimentalAutoDetectLongPolling: true, merge: true })`，保留 SDK 原有 host。本機修正版的瀏覽器 console 未再出現此警告。

這是警告，不是本次 Actions 失敗原因。

來源：https://firebase.google.com/docs/reference/js/v8/firebase.firestore.Settings

## 驗證結果

- `node tools/build.js --expose`：成功；重新產生 `index.html`、`js/app.min.js`、語系檔與 `version.json`。
- 版本指紋：`02c6c9d84d`。
- 修正前原始 39 項測試：26 通過、13 失敗；部分測試仍預期作者的 TURN／停用中繼與舊存檔提示。
- 測試更新為本副本實際契約：Firebase 中繼啟用、上游 TURN 關閉、正確手動存檔提示；未為了通過測試重開上游 TURN。
- 修正後：**48 項通過、0 失敗、0 跳過**，涵蓋語系、網路封包、中繼 fallback、部署設定、管理員 UID 一致與本機預覽。
- 瀏覽器：繁中登入畫面 → 訪客 → 8 題個性測驗 → 炎兔兒夥伴 → 主選單 → 單人遊戲 → 結算 → 回主選單，完整走通。
- 實際單人遊戲結算：44 秒、18 擊敗；這是簡短 smoke test，不是長時間效能測試。
- 抽獎頁面及 10／100 抽按鈕正常載入；沒有實際消耗帳號抽獎券。
- 本機修正版 console：未觀察到 error 或 warning。

重跑：

```bash
node --test tests/deployment.test.cjs tests/i18n.test.cjs tests/net.test.cjs tests/serve.test.cjs
```

受限環境不允許測試子程序時：

```bash
node --test --test-isolation=none tests/deployment.test.cjs tests/i18n.test.cjs tests/net.test.cjs tests/serve.test.cjs
```

本機預覽（不對外開放）：

```bash
node tools/serve.cjs 8081
```

開啟 `http://127.0.0.1:8081/`。這個預覽伺服器沒有登入門禁，僅監聽本機。

## 上線與雲端待確認

1. 先停用 live workflow，避免在等待部署時继续收到排程錯誤通知。
2. 將本機修正提交並推送你的倉庫，等待 Pages 部署成功；**本次尚未推送**。
3. 用 Firebase 專案擁有者帳號檢查已部署的 Firestore／Realtime Database 規則與索引是否與此倉庫一致。
4. CLI 已登入且確認目標後，部署命令為：

   ```bash
   firebase deploy --only "firestore:rules,firestore:indexes,database" --project pokesurvivor-tw-6b55e
   ```

   本次没有執行這個命令；它會更改雲端權限與索引，應先核對規則。

5. Authentication 的授權網域需有 `parkerlu26.github.io`；使用 Google 登入測本機時也確認 `localhost`／`127.0.0.1`。
6. 使用測試帳號實測：登入 → 改變進度 → 手動儲存成功 → 另一瀏覽器登入 → 確認進度。再使用两個獨立帳號實測好友、房間、直連與中繼。
7. ALLOW_RELAY 啟用會使用 Firebase RTDB 傳輸額度。若朋友連線／存檔出錯，檢查 Firebase Usage 是否達上限；本次無主控台存取權，沒有證實額度已耗盡。
8. 管理員 UID 在客戶端與本地 Firestore 規則相同，但未驗證雲端規則是否已更新，也未使用管理員帳號發放物品。

Firestore 索引來源：https://firebase.google.com/docs/firestore/query-data/indexing

## 「私人版本」與網站門禁不同

目前是獨立 Firebase 的自架副本，**不是只有指定朋友能開啟的網站**：本次匿名瀏覽器就能載入網站並以訪客遊玩。

GitHub Pages 的倉庫可見性不等於網站存取控制。若要求真正只有朋友能進入，應另外設計站點門禁以及 Firestore／RTDB 的成員白名單；不能只隱藏註冊按鈕或分享連結。

來源：https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site

## 未驗證的部分

- 郵件是否全數屬於上述 live 失敗通知。
- Google 登入與已有帳號密碼登入。
- 正式 Firebase 規則、索引、剩餘用量與上傳結果。
- 2～4 人實際跨網路連線、長局穩定性與管理員發放。
- GitHub 推送後的正式部署與後續排程狀態。

如果還有其他錯誤，請提供一封隱去個資的通知內容，或遊戲錯誤截圖與發生時間；不要貼密碼、Cookie、ID token 或服務帳號私鑰。
