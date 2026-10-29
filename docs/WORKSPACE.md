# 本機專案工作區

移動日期：2026-10-26。

- 專案根目錄：`C:\Users\nicwe\antigravity\poke`。
- 原始位置：`E:\test\pokesurvivor-tw`，僅作歷史紀錄。
- Git commit、main 分支、GitHub 遠端與 Firebase 專案設定均保留。
- 本機補丁、SHA-256 檔、部署確認、補丁驗證副本與搬移清單都在 `.local-delivery`，此目錄已列入 Git 忽略規則。
- 補丁與搬移清單是歷史證據，保留原內容；不要修改補丁而仍沿用原 SHA-256。

## 啟動本機預覽

```powershell
Set-Location -LiteralPath 'C:\Users\nicwe\antigravity\poke'
node tools/serve.cjs 8081
```

瀏覽器開啟 `http://127.0.0.1:8081/`。伺服器只監聽本機。

## 檢查與建置

```powershell
Set-Location -LiteralPath 'C:\Users\nicwe\antigravity\poke'
node --test --test-isolation=none tests/deployment.test.cjs tests/i18n.test.cjs tests/net.test.cjs tests/serve.test.cjs
node tools/build.js --expose
```

## Codex 專案位置

檔案搬移不會自動更改 Codex 既有任務或已儲存專案的工作目錄。
請從新資料夾開啟專案；原本登記的 `E:\test` 不再放置此專案檔案。

此次只更新本機文件與檔案位置，沒有推送新的 GitHub 提交，也沒有更改雲端玩家資料。