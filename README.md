# GCTI 靜態網站

這是可獨立部署的 HTML、CSS 與 JavaScript 網站，不需要 WordPress、資料庫或付費佈景主題。首頁依 GCTI Figma Page 1 的量測值設定 1920×2803 畫板節奏、1200px 內容寬、142px 品牌列、42px 導覽、600px 輪播、390×260px 簡介照片與 24/32px 標題。已直接從 Figma 匯入首頁主視覺、簡介照片及三張入口卡原始圖片，均以本機素材提供。介面使用思源黑體／Noto Sans TC 字型優先堆疊。

## 本機預覽

在終端機切換到此 `site` 資料夾後，執行：

```sh
python3 -m http.server 8000
```

接著用瀏覽器開啟 `http://localhost:8000`。也可以將整個資料夾部署到支援靜態檔案的學校主機或網站代管服務。

## 網頁與內容

- `index.html`：首頁
- `news/index.html`：消息列表，支援分類、標題搜尋與分頁
- `news/post.html?id=...`：消息詳情
- `pages/page.html?slug=...`：Wix 分類內頁共用模板
- `assets/js/news-data.js`：消息標題、分類、日期與已保存的文章內容
- `assets/js/navigation-data.js`：依 Wix 原站分類建立的階層導覽
- `assets/js/page-data.js`：14 個本機 Wix 頁面與 7 個原站獨立頁面記錄
- `../scripts/build_site_pages.py`：從備份 HTML 重新整理內頁與圖片
- `assets/css/site.css`：全站版型與設計樣式

## 編輯網站內容

專案根目錄的 `scripts/開啟GCTI後台.command` 會啟動只接受本機連線的編輯服務。啟動後在瀏覽器開啟 `http://127.0.0.1:8001/admin.html`。也可以在專案根目錄執行 `python3 scripts/gcti_editor_server.py`。

- **首頁**：直接在即時預覽中修改內容，使用工具列格式化文字、加入連結、圖片或影片。
- **網站內頁**：修改現有內頁或新增頁面；富文字區支援標題、清單、連結、圖片和影片。
- **最新消息**：新增、編輯、刪除消息，管理標題、日期、分類、封面與文章內容。
- **導覽分類**：修改一級分類及子分類名稱和連結，也可新增分類。
- **全站設定**：修改頁首社群連結與每頁共用的頁尾聯絡資訊。
- **圖片與影片**：上傳 JPG、PNG、GIF、WebP、MP4 或 WebM，單檔上限 50 MB；YouTube 和 Vimeo 可用網址嵌入。

按「儲存全部變更」後，編輯內容會寫入 `assets/js/` 的網站資料檔，素材則放在 `assets/uploads/`。網站重新整理後即可看到修改。要更新線上網站，將整個 `site` 資料夾重新部署到網站主機；此編輯器是在你的電腦上使用的工具，並非公開網站上的多人管理後台。請勿將本機編輯服務公開到網際網路。

「匯出內容備份」可備份文字及頁面資料；要完整備份，請連同 `site/assets/uploads/` 一起保存。資料仍以 39 則已盤點消息和目前備份的頁面為起點；未備份的 Wix 內頁或消息原文仍需補入，才能完整還原。
