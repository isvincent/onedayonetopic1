# 每日重大事件說

繁體中文事件解說入口，首頁 `index.html`。2026-10-24 從指定 Drive 資料夾讀取全部 7 個 HTML，保留原始教材內容與來源資訊。本套件尚未部署到 GitHub 或 Apps Script。

## 建議架構與自動更新

`訪客 → GitHub Pages（PWA 首頁）→ Apps Script 唯讀 API → 指定 Drive 資料夾`

完成一次設定後，只需將新 HTML 放入原資料夾，不用修改網站或 GitHub。訪客開啟首頁時、回到分頁時及每 5 分鐘會重新取得清單；點擊主題時才讀取該檔案。網頁關閉時不需執行排程，下次開啟就讀取當時的資料夾。只取資料夾直接包含的 `.html` / `.htm`，不遞迴子資料夾，沒有固定 7 檔上限。大量檔案仍受 Apps Script 執行時間與配額限制。

未設定 API 時展示隨附快照並標示狀態，不會假裝已連線。建議檔名：`2026-10-25_事件主題.html`，也接受 `20261025_主題.html`、`2026.10.25_主題.html`。未辨識或無效日期的 HTML 仍保留在清單底部（最新排序），日期篩選可能將其排除。相同日期以標題排序。

## 第一步：部署 Google Apps Script（一次）

1. 使用有權讀取資料夾的 Google 帳號，前往 https://script.google.com/ →「新增專案」，命名為「每日重大事件說 API」。
2. 將 `apps-script/Code.gs` 全部貼入編輯器的 `程式碼.gs`，取代預設內容。資料夾 ID 已填好。
3. 左側「專案設定」開啟「在編輯器中顯示 appsscript.json 資訊清單檔案」，將隨附的 `apps-script/appsscript.json` 貼入。此程式只申請 Drive 唯讀範圍。
4. 上方函式選 `testFolder` →「執行」→ 授權自己的專案讀取 Drive。查看執行記錄，應有全部 HTML。若未驗證提示出現，先確認這是你剛建立的程式，再依帳號允許的方式完成授權；學校政策可能限制這一步。
5. 右上「部署」→「新增部署作業」→ 齒輪選「網頁應用程式」。執行身分選「我」；誰可以存取選「所有人」（含未登入者）。若組織不提供此選項，本套件的公開 JSONP 方式無法使用，需由管理員允許或改用具登入驗證的後端。
6. 按部署，複製以 `/exec` 結尾的網址，不是 `/dev`。
7. 在無痕視窗開啟 `部署網址?action=list`，應看到 JSON 清單，不能是登入頁或權限錯誤。

**發布範圍：** 以「我」執行且「所有人」可存取後，任何取得 API 網址者都能閱讀指定資料夾內的全部 HTML。這不改變 Drive 的分享設定，但會透過 API 對外提供內容。請只將允許公開的教材放入此資料夾。API 會檢查 HTML 確實屬於指定資料夾，無法用其他檔案 ID 任意讀取你的 Drive。本套件不包含 OAuth token 或金鑰。

## 第二步：設定網站

用文字編輯器開啟 `config.js`：

```js
window.APP_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/你的部署ID/exec',
  refreshMs: 300000
};
```

只要改這一次。請勿放入 Google 密碼或 OAuth token。API 使用 Google 官方 Content Service 的 JSONP 方式處理跨網域，不需額外 CORS 代理。網站只應設定自己部署、可信任的 API 網址。

## 第三步：上傳 GitHub Pages

1. 在 GitHub 建立儲存庫，例如 `daily-events`。若使用公開儲存庫，隨附的 `content/` 原始教材也會公開。
2. 將**本資料夾裡的內容**上傳儲存庫根目錄，確保根目錄直接看到 `index.html`。可將 `apps-script/`、`qa/` 一起上傳，或只上傳網站檔案。不要只把 ZIP 放上去，也不要再包一層 `daily-events/`。
3. 進入 Settings → Pages → Build and deployment → Source：Deploy from a branch → 選 `main`、`/(root)` → Save。
4. 等待 Pages 部署完成，使用 GitHub 顯示的 HTTPS 網址開啟網站。檢查狀態顯示「已連接雲端」。
5. 新增一個 `YYYY-MM-DD_主題.html` 到 Drive 原資料夾，按首頁「更新清單」或等待約 5 分鐘。確認新主題出現、排序正確、點擊可播放；不需要再上傳 GitHub。

日後修改 Apps Script 程式時：部署 → 管理部署作業 → 編輯 → 版本「新增版本」→ 部署，保留原 `/exec` URL。單純新增或修改 Drive HTML 不需要重新部署 Apps Script。

## 功能與操作

- 依日期新到舊瀏覽、主題／檔名／日期搜尋、日期區間、反向排序、收藏（此瀏覽器保存）。
- 點「播放解說」立即載入原始 HTML，並對現有教材的 `#start` 按鈕送出播放請求；原檔未被修改。新教材如使用不同按鈕 ID，仍可載入，但需使用教材內控制；可在 `app.js` 的 bridge 增加對應啟動方式。
- 瀏覽器可能限制程式觸發的有聲播放或語音合成。若無聲，在教材內按「暫停」再「播放」。這不是 MP4 轉檔；旁白、字幕、時間軸與測驗依原 HTML 執行。
- 關閉播放器會移除 iframe，停止該教材。每次開啟從頭開始。
- 七大設定：全螢幕、介面音效、裝置、自動／直式／橫式、繁中／英文介面、18／20／24px 基準字體、系統／亮／暗色。除全螢幕狀態外均本機保存。英文只翻譯網站介面，保留原始中文標題與教材。音效開關控制入口網站的短提示音，教材旁白使用教材自己的音量與靜音按鈕。
- 裝置切換調整預覽內容寬度（手機 540、平板 900、電腦 1440px 上限），直式偏單欄、橫式偏雙欄；小螢幕仍保持單欄，不鎖定實體裝置方向。教材保留自己的畫布尺寸與字型；需更清楚可使用教材內全螢幕。
- 全螢幕需瀏覽器支援，部分 iPhone 瀏覽器無此 API，會顯示提示。
- 色彩圖卡、世界地球插圖均本地 SVG／CSS／Unicode 示意，不使用外站新聞照片，不暗示是現場影像。支援減少動態效果系統偏好。

## PWA 與離線

在 HTTPS 或 localhost 上啟用 Service Worker。Chrome／Edge 符合安裝條件時顯示「安裝到裝置」，也可從瀏覽器選單安裝；iPhone Safari 使用分享 → 加入主畫面。是否提供安裝按鈕取決於瀏覽器。

第一次連線後可離線開啟首頁、設定與快照／快取清單。**教材 HTML 不納入離線快取**；原教材可能使用外部資源與裝置語音，離線播放不保證。API 清單採即時讀取，不由 Service Worker 快取。網站靜態檔案採網路優先，斷線時使用快取；正式改版可遞增 `sw.js` 的 CACHE 版本。

## 本機預覽

請在本資料夾執行 `python -m http.server 8000`，瀏覽 http://localhost:8000 。不要直接雙擊 `index.html`：`file://` 不能正常讀取 JSON 或註冊 PWA。

## 完整結構

```text
index.html                 首頁
style.css                  響應式與主題樣式
app.js                     搜尋／收藏／設定／播放器／雲端讀取
config.js                  一次設定 Apps Script URL
manifest.webmanifest       PWA 安裝資訊
sw.js                      首頁離線快取
.nojekyll                  GitHub Pages 靜態檔支援
assets/icon.svg            地球播放圖示
assets/icon-192.png         PWA 圖示
assets/icon-512.png         PWA 圖示（含安全邊界）
data/catalog.json          7 則原始資料夾快照
content/*.html             7 份完整原始 HTML（以 Drive ID 命名）
apps-script/Code.gs         唯讀 API
apps-script/appsscript.json 權限與時區
qa/                        檢查程式、報告與截圖
README.md                  本操作說明
```

## 驗證與限制

本機檢查結果見 `qa/report.json`。本套件交付時尚未取得您部署的 `/exec` 網址，因此實際 Apps Script 授權、匿名存取、跨網域讀取及未來新增檔案，仍需按上方部署驗收步驟測試。頁面上新增主題反映的是使用者提供的教材；此次網站製作不另行核實各教材的新聞事實。

獨立 HTML 應內嵌所需圖片／CSS／JS，或使用可公開存取的 HTTPS 絕對路徑；相對引用 Drive 同資料夾附件不會自動被轉換。iframe 以 `allow-scripts` 隔離，避免教材操作入口網站儲存空間；依賴同源儲存或父視窗的未來教材可能需另行適配。

## 官方參考

- Apps Script 網頁應用程式：https://developers.google.com/apps-script/guides/web
- Content Service 與 JSONP：https://developers.google.com/apps-script/guides/content
- Google HTML sandbox 說明：https://developers.google.com/apps-script/guides/html/restrictions
- GitHub Pages：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

本案依指定 GitHub 套件交付，未代為變更 Drive 分享、公開部署 API 或建立 GitHub 儲存庫。
