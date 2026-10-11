(() => {
  "use strict";
  const data = { news: window.GCTI_NEWS || [], pages: window.GCTI_PAGES || [], navigation: window.GCTI_NAV || [], home: window.GCTI_HOME || {}, settings: window.GCTI_SETTINGS || {} };
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let activeView = "home", pageIndex = -1, newsIndex = -1, navPath = null, editingHome = false;
  const status = $("#save-state");
  let richInsertTarget = "home";

  function toast(message, error = false) {
    const el = document.createElement("div"); el.className = "toast" + (error ? " error" : ""); el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 3000);
  }
  function markDirty() { status.textContent = "有尚未儲存的修改"; status.style.color = "#b54708"; }
  function setSaved(message = "已儲存到網站檔案") { status.textContent = message; status.style.color = "#067647"; }

  function blocksToHtml(item) {
    if (item.bodyHtml) return item.bodyHtml;
    const blocks = item.blocks || item.content || [];
    let out = "";
    for (const b of blocks) {
      if (b.type === "list") out += "<ul>" + (b.items || []).map(x => `<li>${escapeHtml(x)}</li>`).join("") + "</ul>";
      else if (b.type === "link") out += `<p><a href="${escapeHtml(b.href)}">${escapeHtml(b.text)}</a></p>`;
      else if (/^h[1-6]$/.test(b.type)) out += `<h2>${escapeHtml(b.text)}</h2>`;
      else if (b.type === "blockquote") out += `<blockquote>${escapeHtml(b.text)}</blockquote>`;
      else out += `<p>${escapeHtml(b.text)}</p>`;
    }
    (item.images || []).forEach(img => { out += `<figure><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || "")}">${img.alt ? `<figcaption>${escapeHtml(img.alt)}</figcaption>` : ""}</figure>`; });
    return out || "<p><br></p>";
  }
  function richToolbar(id) { return `<div class="editor-toolbar form-toolbar" data-editor="${id}"><button data-rich-cmd="bold"><b>B</b></button><button data-rich-cmd="italic"><i>I</i></button><button data-rich-cmd="formatBlock" data-value="h2">標題</button><button data-rich-cmd="formatBlock" data-value="p">段落</button><button data-rich-cmd="insertUnorderedList">• 清單</button><button data-rich-insert="link">插入連結</button><button data-rich-insert="image">加入圖片</button><button data-rich-insert="video">嵌入影片</button></div>`; }
  function videoEmbed(url) { const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/) || url.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (!match) return null; return url.includes("vimeo") ? `https://player.vimeo.com/video/${match[1]}` : `https://www.youtube-nocookie.com/embed/${match[1]}`; }
  function bindRichToolbar(container) {
    container.querySelectorAll(".form-toolbar button").forEach(button => { button.addEventListener("mousedown", event => event.preventDefault()); button.addEventListener("click", () => {
      const editor = $("#" + button.closest(".form-toolbar").dataset.editor); if (!editor) return; editor.focus();
      if (button.dataset.richCmd) document.execCommand(button.dataset.richCmd, false, button.dataset.value || null);
      if (button.dataset.richInsert === "link") { const url = prompt("請輸入連結網址"); if (url) document.execCommand("createLink", false, url); }
      if (button.dataset.richInsert === "image") { richInsertTarget = button.closest(".form-toolbar").dataset.editor; $("#inline-media").click(); }
      if (button.dataset.richInsert === "video") { const url = prompt("請貼上 YouTube 或 Vimeo 影片網址"); if (url) { const src = videoEmbed(url); if (!src) toast("網址格式無法辨識，請使用 YouTube 或 Vimeo 連結。", true); else document.execCommand("insertHTML", false, `<div class="video-frame"><iframe src="${src}" title="嵌入影片" loading="lazy" allowfullscreen></iframe></div>`); } }
      markDirty();
    }); });
  }
  function populateList(select, items, titleKey) {
    select.replaceChildren(...items.map((item, i) => { const o = document.createElement("option"); o.value = i; o.textContent = item[titleKey] || "（未命名）"; return o; }));
  }
  function field(label, value, key, type = "text", full = false, placeholder = "") {
    return `<div class="field${full ? " full" : ""}"><label for="f-${key}">${label}</label><input id="f-${key}" data-key="${key}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"></div>`;
  }
  function renderPageForm() {
    const item = data.pages[pageIndex], panel = $("#page-form");
    if (!item) { panel.innerHTML = '<div class="empty-panel">從左側選擇頁面，或新增一個內頁。</div>'; return; }
    panel.innerHTML = `<div class="form-grid">${field("頁面標題", item.title, "title")}${field("網址代稱", item.slug, "slug")}${field("分類", item.category, "category")}${field("來源備註", item.source, "source")}<div class="field full"><label>頁面內容</label>${richToolbar("page-rich")}<div class="rich-editor" id="page-rich" contenteditable="true" spellcheck="true">${blocksToHtml(item)}</div></div></div><div class="form-actions"><button class="button danger" id="delete-page">刪除這個頁面</button><button class="button primary" id="apply-page">套用修改</button></div>`;
    bindRichToolbar(panel);
    $("#apply-page").onclick = () => { savePageForm(); toast("內頁修改已套用，記得儲存全部變更。"); };
    $("#delete-page").onclick = () => { if (!confirm(`確定刪除「${item.title}」？`)) return; data.pages.splice(pageIndex, 1); pageIndex = -1; refreshPageList(); renderPageForm(); markDirty(); };
    $("#page-rich").addEventListener("input", markDirty);
    $("#page-form").querySelectorAll("input").forEach(el => el.addEventListener("input", markDirty));
  }
  function savePageForm() {
    const item = data.pages[pageIndex]; if (!item) return;
    $("#page-form").querySelectorAll("input[data-key]").forEach(el => item[el.dataset.key] = el.value.trim());
    const rich = $("#page-rich"); if (rich) item.bodyHtml = rich.innerHTML;
    if (!item.slug) item.slug = "page-" + Date.now();
  }
  function refreshPageList() { populateList($("#page-select"), data.pages, "title"); if (pageIndex >= 0) $("#page-select").value = pageIndex; }

  function renderNewsForm() {
    const item = data.news[newsIndex], panel = $("#news-form");
    if (!item) { panel.innerHTML = '<div class="empty-panel">從左側選擇消息，或新增一則消息。</div>'; return; }
    panel.innerHTML = `<div class="form-grid">${field("消息標題", item.title, "title", "text", true)}${field("網址代稱", item.id, "id")}${field("分類", item.category, "category")}${field("日期", item.date, "date")}${field("封面圖片路徑", item.image || "", "image", "text", true, "assets/uploads/圖片檔名.jpg")}<div class="field full"><label>消息內容</label>${richToolbar("news-rich")}<div class="rich-editor" id="news-rich" contenteditable="true" spellcheck="true">${blocksToHtml(item)}</div></div></div><div class="form-actions"><button class="button danger" id="delete-news">刪除這則消息</button><button class="button primary" id="apply-news">套用修改</button></div>`;
    bindRichToolbar(panel);
    $("#apply-news").onclick = () => { saveNewsForm(); toast("消息修改已套用，記得儲存全部變更。"); };
    $("#delete-news").onclick = () => { if (!confirm(`確定刪除「${item.title}」？`)) return; data.news.splice(newsIndex, 1); newsIndex = -1; refreshNewsList(); renderNewsForm(); markDirty(); };
    $("#news-rich").addEventListener("input", markDirty);
    $("#news-form").querySelectorAll("input").forEach(el => el.addEventListener("input", markDirty));
  }
  function saveNewsForm() {
    const item = data.news[newsIndex]; if (!item) return;
    $("#news-form").querySelectorAll("input[data-key]").forEach(el => item[el.dataset.key] = el.value.trim());
    const rich = $("#news-rich"); if (rich) item.bodyHtml = rich.innerHTML;
    if (!item.id) item.id = "news-" + Date.now();
  }
  function refreshNewsList() { populateList($("#news-select"), data.news, "title"); if (newsIndex >= 0) $("#news-select").value = newsIndex; }

  function flattenNav(items = data.navigation, prefix = [], out = []) {
    items.forEach((item, i) => { const path = [...prefix, i]; out.push({ item, path, label: "　".repeat(path.length - 1) + item.label }); if (Array.isArray(item.children)) flattenNav(item.children, path, out); });
    return out;
  }
  function byPath(path) { let item; let cur = data.navigation; for (const index of path || []) { item = cur[index]; if (!item) return null; cur = item.children || []; } return item; }
  function renderNavList() {
    const sel = $("#nav-select"), flat = flattenNav();
    sel.replaceChildren(...flat.map(entry => { const o = document.createElement("option"); o.value = JSON.stringify(entry.path); o.textContent = entry.label; return o; }));
    const found = flat.find(entry => JSON.stringify(entry.path) === JSON.stringify(navPath));
    if (found) sel.value = JSON.stringify(navPath); else if (flat.length) { navPath = flat[0].path; sel.value = JSON.stringify(navPath); }
    renderNavForm();
  }
  function renderNavForm() {
    const item = byPath(navPath), panel = $("#nav-form");
    if (!item) { panel.innerHTML = '<div class="empty-panel">新增或選擇一個導覽分類。</div>'; return; }
    panel.innerHTML = `<div class="form-grid">${field("顯示名稱", item.label, "label")}${field("網站連結", item.href || "", "href", "text", true, "news/index.html 或完整網址")}${field("連結到內頁（選填）", item.slug || "", "slug", "text", true, "填入內頁網址代稱")}</div><div class="form-actions"><button class="button danger" id="delete-nav">刪除分類</button><button class="button primary" id="apply-nav">套用修改</button></div>`;
    $("#apply-nav").onclick = () => { saveNavForm(); renderNavList(); markDirty(); toast("導覽分類已套用修改。"); };
    $("#delete-nav").onclick = () => { if (!confirm(`確定刪除「${item.label}」及其子分類？`)) return; const parentPath = navPath.slice(0, -1); const parent = parentPath.length ? byPath(parentPath) : null; const siblings = parent ? parent.children : data.navigation; siblings.splice(navPath[navPath.length - 1], 1); navPath = null; renderNavList(); markDirty(); };
    panel.querySelectorAll("input").forEach(el => el.addEventListener("input", markDirty));
  }
  function saveNavForm() { const item = byPath(navPath); if (!item) return; $("#nav-form").querySelectorAll("input[data-key]").forEach(el => item[el.dataset.key] = el.value.trim()); }

  const settingLabels = { schoolUrl:"輔仁大學連結", facebookUrl:"Facebook 連結", instagramUrl:"Instagram 連結", youtubeUrl:"YouTube 連結", programName:"學程名稱", programSecretary:"學程聯絡人", programPhone:"學程電話", programEmail:"學程電子郵件", programAddress:"學程地址", collegeName:"學院名稱", collegeSecretary1:"學院聯絡人一", collegePhone1:"學院電話一", collegeEmail1:"學院電子郵件一", collegeSecretary2:"學院聯絡人二", collegePhone2:"學院電話二", collegeEmail2:"學院電子郵件二", collegeAddress:"學院地址" };
  function renderSettingsForm() {
    const groups = [["頁首連結",["schoolUrl","facebookUrl","instagramUrl","youtubeUrl"]],["學程聯絡資訊",["programName","programSecretary","programPhone","programEmail","programAddress"]],["學院聯絡資訊",["collegeName","collegeSecretary1","collegePhone1","collegeEmail1","collegeSecretary2","collegePhone2","collegeEmail2","collegeAddress"]]];
    $("#settings-form").innerHTML = groups.map(([title,keys]) => `<h2 class="settings-heading">${title}</h2><div class="form-grid">${keys.map(key => field(settingLabels[key],data.settings[key]||"",key,"text",key.endsWith("Address")||key.endsWith("Url"))).join("")}</div>`).join("") + '<div class="form-actions"><button class="button primary" id="apply-settings">套用設定</button></div>';
    $("#apply-settings").onclick = () => { saveSettingsForm(); toast("全站設定已套用修改。記得儲存全部變更。"); };
    $("#settings-form").querySelectorAll("input").forEach(el => el.addEventListener("input", markDirty));
  }
  function saveSettingsForm() { $("#settings-form").querySelectorAll("input[data-key]").forEach(el => data.settings[el.dataset.key] = el.value.trim()); }

  function setView(name) {
    if (activeView === "pages") savePageForm(); if (activeView === "news") saveNewsForm(); if (activeView === "navigation") saveNavForm(); if (activeView === "settings") saveSettingsForm();
    activeView = name;
    document.querySelectorAll(".side-link[data-view]").forEach(el => el.classList.toggle("active", el.dataset.view === name));
    document.querySelectorAll(".view").forEach(el => el.classList.toggle("active", el.id === "view-" + name));
  }
  document.querySelectorAll(".side-link[data-view]").forEach(el => el.addEventListener("click", () => setView(el.dataset.view)));
  $("#page-select").addEventListener("change", () => { savePageForm(); pageIndex = Number($("#page-select").value); renderPageForm(); });
  $("#news-select").addEventListener("change", () => { saveNewsForm(); newsIndex = Number($("#news-select").value); renderNewsForm(); });
  $("#nav-select").addEventListener("change", () => { saveNavForm(); navPath = JSON.parse($("#nav-select").value); renderNavForm(); });
  $("#new-page").onclick = () => { savePageForm(); data.pages.push({ slug: "new-page-" + Date.now(), title: "新頁面", category: "網站資訊", source: "編輯器建立", bodyHtml: "<p>請在此輸入頁面內容。</p>" }); pageIndex = data.pages.length - 1; refreshPageList(); renderPageForm(); markDirty(); };
  $("#new-news").onclick = () => { saveNewsForm(); data.news.unshift({ id: "news-" + Date.now(), title: "新消息標題", category: "行政公告", date: new Date().toLocaleDateString("zh-TW"), bodyHtml: "<p>請在此輸入消息內容。</p>" }); newsIndex = 0; refreshNewsList(); renderNewsForm(); markDirty(); };
  $("#nav-add-root").onclick = () => { saveNavForm(); data.navigation.push({ label: "新分類", href: "#" }); navPath = [data.navigation.length - 1]; renderNavList(); markDirty(); };
  $("#nav-add-child").onclick = () => { saveNavForm(); const parent = byPath(navPath); if (!parent) return toast("請先選擇要新增子分類的一級分類。", true); if (!Array.isArray(parent.children)) parent.children = []; parent.children.push({ label: "新子分類", href: "#" }); navPath = [...navPath, parent.children.length - 1]; renderNavList(); markDirty(); };

  async function upload(file) {
    const res = await fetch("/api/upload?name=" + encodeURIComponent(file.name), { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const result = await res.json(); if (!res.ok) throw new Error(result.error || "上傳失敗"); return result;
  }
  function insertAtHome(html) {
    const frame = $("#home-preview"), d = frame.contentDocument;
    if (!d || !d.querySelector("main")) return toast("首頁預覽尚未載入完成。", true);
    d.execCommand("insertHTML", false, html); markDirty();
  }
  function captureHome() {
    const main = $("#home-preview").contentDocument?.querySelector("main"); if (!main) return;
    const clone = main.cloneNode(true); clone.removeAttribute("contenteditable"); clone.style.outline = "";
    // News cards are data-driven; keep the grid empty in the saved template so current news is rendered once on load.
    clone.querySelector("#home-news-list")?.replaceChildren();
    clone.querySelectorAll("video.pathway-video").forEach(video => { const src = video.dataset.src || video.getAttribute("src"); video.pause(); video.removeAttribute("src"); if (src) video.setAttribute("data-src", src.replace(/^https?:\/\/[^/]+\//, "")); });
    data.home.homeHtml = clone.innerHTML;
  }
  document.querySelectorAll("#home-toolbar [data-command]").forEach(button => button.addEventListener("click", () => {
    const frame = $("#home-preview"), d = frame.contentDocument; d?.execCommand(button.dataset.command, false, button.dataset.value || null); frame.contentWindow?.focus(); markDirty();
  }));
  $("#home-toolbar [data-insert=link]").onclick = () => { const url = prompt("請輸入連結網址（https://、mailto: 或頁面路徑）"); if (!url) return; const frame = $("#home-preview"), d = frame.contentDocument; d?.execCommand("createLink", false, url); frame.contentWindow?.focus(); markDirty(); };
  $("#home-toolbar [data-insert=image]").onclick = () => { richInsertTarget = "home"; $("#inline-media").click(); };
  $("#home-toolbar [data-insert=video]").onclick = () => {
    const url = prompt("請貼上 YouTube 或 Vimeo 影片網址"); if (!url) return;
    const src = videoEmbed(url); if (!src) return toast("網址格式無法辨識，請使用 YouTube 或 Vimeo 連結。", true);
    insertAtHome(`<div class="video-frame"><iframe src="${src}" title="嵌入影片" loading="lazy" allowfullscreen></iframe></div>`);
  };
  $("#home-edit-toggle").onclick = () => {
    const frame = $("#home-preview"), main = frame.contentDocument?.querySelector("main"); if (!main) return toast("請稍等首頁預覽載入完成。", true);
    if (editingHome) captureHome();
    editingHome = !editingHome; main.contentEditable = String(editingHome); main.style.outline = editingHome ? "2px dashed #2e90fa" : "";
    $("#home-toolbar").hidden = !editingHome; $("#home-edit-toggle").textContent = editingHome ? "完成編輯" : "開始編輯首頁"; frame.contentWindow.focus();
  };
  $("#inline-media").addEventListener("change", async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const result = await upload(file); const markup = result.type.startsWith("image/") ? `<img src="${result.url}" alt="${escapeHtml(file.name)}">` : `<video controls playsinline src="${result.url}"></video>`; if (richInsertTarget === "home") insertAtHome(markup); else { const editor = $("#" + richInsertTarget); editor?.focus(); if (editor) document.execCommand("insertHTML", false, markup); markDirty(); } await refreshMedia(); }
    catch (err) { toast(err.message, true); } finally { event.target.value = ""; }
  });
  $("#media-upload").addEventListener("change", async event => {
    for (const file of event.target.files || []) { try { await upload(file); } catch (err) { toast(err.message, true); } }
    await refreshMedia(); event.target.value = "";
  });

  async function saveAll() {
    if (activeView === "pages") savePageForm(); if (activeView === "news") saveNewsForm(); if (activeView === "navigation") saveNavForm(); if (activeView === "settings") saveSettingsForm();
    if (editingHome) captureHome();
    const payload = { news: data.news, pages: data.pages, navigation: data.navigation, home: data.home, settings: data.settings };
    status.textContent = "正在儲存…";
    try { const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const out = await res.json(); if (!res.ok) throw new Error(out.error || "儲存失敗"); setSaved("已儲存 " + new Date(out.savedAt).toLocaleTimeString("zh-TW")); toast("修改已寫入網站檔案。重新整理預覽即可查看。"); }
    catch (err) { status.textContent = "儲存失敗"; status.style.color = "#b42318"; toast(err.message + "。請確認已用「開啟GCTI後台.command」啟動編輯器。", true); }
  }
  $("#save-all").onclick = saveAll;
  $("#logout").onclick = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { location.replace("/admin.html"); } };
  $("#export-backup").onclick = () => { const payload = { version: 1, exportedAt: new Date().toISOString(), ...data }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gcti-content-backup.json"; a.click(); URL.revokeObjectURL(a.href); };
  $("#import-backup").addEventListener("change", async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const payload = JSON.parse(await file.text()); for (const key of ["news", "pages", "navigation", "home", "settings"]) if (payload[key] !== undefined) data[key] = payload[key]; pageIndex = newsIndex = -1; refreshPageList(); refreshNewsList(); renderPageForm(); renderNewsForm(); renderNavList(); renderSettingsForm(); await saveAll(); }
    catch (err) { toast("無法讀取備份檔：「" + err.message + "」", true); } finally { event.target.value = ""; }
  });
  async function refreshMedia() {
    try { const out = await (await fetch("/api/media")).json(); const list = $("#media-list"); list.replaceChildren(...out.files.map(f => { const chip = document.createElement("button"); chip.type = "button"; chip.className = "media-chip"; chip.textContent = f.name + (f.type.startsWith("video/") ? " · 影片" : " · 圖片"); chip.title = "點擊複製素材路徑：" + f.url; chip.addEventListener("click", async () => { try { await navigator.clipboard.writeText(f.url); toast("已複製素材路徑，可貼到消息封面欄位。"); } catch { toast(f.url); } }); return chip; })); }
    catch { /* editor may still be opened from a plain static host */ }
  }
  async function applyAccountRole() {
    const response = await fetch("/api/auth/me");
    if (response.status === 401) { location.replace("/admin-login.html"); return; }
    if (!response.ok) throw new Error("後台驗證服務沒有正常回應（HTTP " + response.status + "）。");
    const account = await response.json();
    const isAdmin = account.role === "admin";
    $("#account-role").textContent = (isAdmin ? "管理員" : "內容編輯者") + " · " + account.email;
    if (isAdmin) {
      document.querySelectorAll('.side-link[data-view="navigation"], .side-link[data-view="settings"]').forEach(el => { el.hidden = false; });
      $("#backup-bar").hidden = false;
    }
  }
  applyAccountRole().catch(error => {
    const workspace = $(".workspace");
    const detail = error instanceof TypeError
      ? "目前連到的可能是一般網站預覽伺服器，或專用編輯器後台已停止。"
      : error.message;
    workspace.innerHTML = `<main class="main-panel"><section class="backend-error" role="alert"><p class="eyebrow">LOCAL EDITOR SERVICE</p><h1>無法連接後台編輯服務</h1><p>${escapeHtml(detail)}</p><p>請先關閉目前的本機網站伺服器，再執行「scripts/開啟GCTI後台.command」，然後重新整理這個頁面。</p><a class="button primary" href="/admin-login.html">返回登入頁</a></section></main>`;
    $("#save-all").disabled = true;
    $("#logout").hidden = true;
    status.textContent = "後台服務未連線";
    status.style.color = "#b42318";
  });
  refreshPageList(); refreshNewsList(); renderPageForm(); renderNewsForm(); renderNavList(); renderSettingsForm(); refreshMedia();
})();
