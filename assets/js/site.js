(function(){
  "use strict";
  const news=Array.isArray(window.GCTI_NEWS)?window.GCTI_NEWS:[];
  const pageSize=9;
  const categories=["全部消息",...new Set(news.map(item=>item.category).filter(Boolean))];
  const assetBase=document.body.dataset.page==="home"?"":"../";
  const esc=(value)=>String(value??"");

  function card(item){
    const article=document.createElement("article");article.className="news-card";
    const meta=document.createElement("div");meta.className="news-card-meta";
    const tag=document.createElement("span");tag.className="news-category";tag.textContent=item.category||"消息";
    const date=document.createElement("time");date.textContent=item.date||"";
    meta.append(tag,date);
    const title=document.createElement("h3");title.textContent=item.title;
    const postPath=document.body.dataset.page==="home"?"news/post.html":"post.html";
    const link=document.createElement("a");link.className="news-card-link";link.href=`${postPath}?id=${encodeURIComponent(item.id)}`;link.setAttribute("aria-label",`閱讀：${item.title}`);
    const action=document.createElement("span");action.className="news-card-arrow";action.textContent="閱讀消息 →";
    link.append(meta,title,action);article.append(link);return article;
  }

  function initHome(){
    if(typeof window.GCTI_HOME?.homeHtml==="string"&&window.GCTI_HOME.homeHtml){const main=document.querySelector("main");if(main)main.innerHTML=window.GCTI_HOME.homeHtml}
    const pathwayVideos=[...document.querySelectorAll(".pathway-video[data-src]")];
    const startVideo=video=>{if(!video.src){video.src=video.dataset.src;video.load()}video.play().catch(()=>{});};
    if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){startVideo(entry.target);observer.unobserve(entry.target)}}),{rootMargin:"220px"});pathwayVideos.forEach(video=>observer.observe(video))}else pathwayVideos.forEach(startVideo);
    const target=document.getElementById("home-news-list");if(!target)return;
    news.slice(0,6).forEach(item=>target.append(card(item)));
    const slides=[...document.querySelectorAll(".hero-slide")],dots=[...document.querySelectorAll(".hero-dots button")];let active=0;
    const show=(index)=>{if(!slides.length)return;active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>slide.classList.toggle("is-active",i===active));dots.forEach((dot,i)=>{if(i===active)dot.setAttribute("aria-current","true");else dot.removeAttribute("aria-current")})};
    document.querySelector(".hero-prev")?.addEventListener("click",()=>show(active-1));document.querySelector(".hero-next")?.addEventListener("click",()=>show(active+1));dots.forEach((dot,i)=>dot.addEventListener("click",()=>show(i)));
  }

  function initArchive(){
    const grid=document.getElementById("archive-grid"), chips=document.getElementById("category-list"), count=document.getElementById("results-count"), pager=document.getElementById("pagination"), form=document.getElementById("news-search-form"), input=document.getElementById("news-search");
    if(!grid||!chips||!count||!pager||!input)return;
    const params=new URLSearchParams(location.search);let activeCategory=params.get("category")||"全部消息",query=params.get("q")||"",currentPage=Math.max(1,Number(params.get("page"))||1);
    if(!categories.includes(activeCategory))activeCategory="全部消息";input.value=query;

    categories.forEach(category=>{const button=document.createElement("button");button.type="button";button.className="filter-chip";button.textContent=category;button.setAttribute("aria-pressed",String(category===activeCategory));button.addEventListener("click",()=>{activeCategory=category;currentPage=1;render()});chips.append(button)});

    function render(){
      const normalized=query.trim().toLocaleLowerCase("zh-Hant");
      const filtered=news.filter(item=>(activeCategory==="全部消息"||item.category===activeCategory)&&(!normalized||item.title.toLocaleLowerCase("zh-Hant").includes(normalized)));
      const pages=Math.max(1,Math.ceil(filtered.length/pageSize));currentPage=Math.min(currentPage,pages);
      count.textContent=`共 ${filtered.length} 則消息${activeCategory!=="全部消息"?`・${activeCategory}`:""}`;
      chips.querySelectorAll("button").forEach(button=>button.setAttribute("aria-pressed",String(button.textContent===activeCategory)));
      grid.replaceChildren();
      if(filtered.length===0){const empty=document.createElement("div");empty.className="empty-state";empty.textContent="找不到符合條件的消息，請調整搜尋文字或分類。";grid.append(empty)}
      else filtered.slice((currentPage-1)*pageSize,currentPage*pageSize).forEach(item=>grid.append(card(item)));
      pager.replaceChildren();
      if(pages>1){
        const prev=document.createElement("button");prev.type="button";prev.className="page-button";prev.textContent="上一頁";prev.disabled=currentPage===1;prev.addEventListener("click",()=>{currentPage--;render();document.querySelector(".archive-content").scrollIntoView({behavior:"smooth",block:"start"})});pager.append(prev);
        for(let i=1;i<=pages;i++){const button=document.createElement("button");button.type="button";button.className="page-button";button.textContent=String(i);if(i===currentPage)button.setAttribute("aria-current","page");button.setAttribute("aria-label",`第 ${i} 頁`);button.addEventListener("click",()=>{currentPage=i;render();document.querySelector(".archive-content").scrollIntoView({behavior:"smooth",block:"start"})});pager.append(button)}
        const next=document.createElement("button");next.type="button";next.className="page-button";next.textContent="下一頁";next.disabled=currentPage===pages;next.addEventListener("click",()=>{currentPage++;render();document.querySelector(".archive-content").scrollIntoView({behavior:"smooth",block:"start"})});pager.append(next);
      }
    }
    form.addEventListener("submit",event=>{event.preventDefault();query=input.value;currentPage=1;render()});
    input.addEventListener("input",()=>{query=input.value;currentPage=1;render()});
    render();
  }

  function initPost(){
    const article=document.getElementById("post-article");if(!article)return;
    const id=new URLSearchParams(location.search).get("id"),item=news.find(entry=>entry.id===id);
    const breadcrumb=document.getElementById("breadcrumb-title");
    if(!item){article.className="not-found";article.innerHTML="";const heading=document.createElement("h1");heading.textContent="找不到這則消息";const p=document.createElement("p");p.textContent="連結可能有誤，請回到消息列表瀏覽。";const link=document.createElement("a");link.className="text-link";link.href="index.html";link.textContent="回到最新消息 →";article.append(heading,p,link);return}
    breadcrumb.textContent=item.title;document.title=`${item.title}｜輔仁大學科創學程 GCTI`;
    article.replaceChildren();
    const header=document.createElement("header");header.className="post-header";
    const category=document.createElement("span");category.className="news-category";category.textContent=item.category||"消息";
    const title=document.createElement("h1");title.textContent=item.title;
    const meta=document.createElement("div");meta.className="post-meta";const date=document.createElement("time");date.textContent=item.date||"";meta.append(date);
    header.append(category,title,meta);article.append(header);
    if(item.image){const image=document.createElement("img");image.className="post-cover";image.src=`../${item.image}`;image.alt="";image.loading="lazy";article.append(image)}
    if(typeof item.bodyHtml==="string"&&item.bodyHtml){const body=document.createElement("div");body.className="post-body";body.innerHTML=item.bodyHtml.replace(/(src=["'])assets\/uploads\//g,'$1../assets/uploads/');article.append(body)}
    else if(Array.isArray(item.content)&&item.content.length){
      const body=document.createElement("div");body.className="post-body";
      item.content.forEach(block=>{
        if(block.type==="p"){const el=document.createElement("p");el.textContent=esc(block.text);body.append(el)}
        else if(block.type==="h2"){const el=document.createElement("h2");el.textContent=esc(block.text);body.append(el)}
        else if(block.type==="list"){const list=document.createElement("ul");(block.items||[]).forEach(text=>{const li=document.createElement("li");li.textContent=esc(text);list.append(li)});body.append(list)}
        else if(block.type==="link"&&/^https:\/\//i.test(block.href||"")){const p=document.createElement("p"),link=document.createElement("a");link.href=block.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=esc(block.text);p.append(link);body.append(p)}
      });article.append(body);
    }else{
      const notice=document.createElement("aside");notice.className="missing-content";const p=document.createElement("p");p.textContent="目前保存的資料只有消息標題、分類與日期，沒有這篇的完整原文或附件。為避免誤植，這裡不重建未保存的內容。";notice.append(p);article.append(notice);
    }
    const back=document.createElement("a");back.className="text-link post-return";back.href="index.html";back.textContent="← 回到最新消息";article.append(back);
  }

  function initContent(){
    const target=document.getElementById("page-content");if(!target)return;
    const pages=Array.isArray(window.GCTI_PAGES)?window.GCTI_PAGES:[];
    const slug=new URLSearchParams(location.search).get("slug");
    const item=pages.find(page=>page.slug===slug);
    const title=document.getElementById("page-title"),crumb=document.getElementById("page-breadcrumb"),category=document.getElementById("page-category");
    if(!item){title.textContent="找不到這個頁面";crumb.textContent="頁面不存在";return}
    title.textContent=item.title;crumb.textContent=item.title;category.textContent=item.category||"學程資訊";document.title=`${item.title}｜輔仁大學科創學程 GCTI`;
    if(item.source!=="本機 Wix 備份"){
      const note=document.createElement("aside");note.className="source-note";note.textContent=`本頁依原站導覽建立。此頁在目前的備份資料夾中沒有完整頁面檔案。`;
      target.append(note);
    }
    if(typeof item.bodyHtml==="string"&&item.bodyHtml){target.innerHTML=item.bodyHtml.replace(/(src=["'])assets\/uploads\//g,'$1../assets/uploads/');}
    else {
    (item.blocks||[]).forEach(block=>{
      if(!block.text)return;
      if(/^h[1-6]$/.test(block.type)){const h=document.createElement(block.type==="h1"?"h2":block.type);h.textContent=block.text;target.append(h)}
      else if(block.type==="li"){let list=target.lastElementChild;if(!list||list.tagName!=="UL"){list=document.createElement("ul");target.append(list)}const li=document.createElement("li");li.textContent=block.text;list.append(li)}
      else if(block.type==="blockquote"){const quote=document.createElement("blockquote");quote.textContent=block.text;target.append(quote)}
      else{const p=document.createElement("p");p.textContent=block.text;target.append(p)}
    });
    (item.images||[]).forEach(image=>{const figure=document.createElement("figure"),img=document.createElement("img");img.src=image.src.startsWith("http")||image.src.startsWith("../")?image.src:`../${image.src}`;img.alt=image.alt||"";img.loading="lazy";figure.append(img);if(image.alt){const caption=document.createElement("figcaption");caption.textContent=image.alt;figure.append(caption)}target.append(figure)});
    }
    if((item.links||[]).length){const section=document.createElement("section");section.className="page-resources";const h=document.createElement("h2");h.textContent="相關連結與文件";const list=document.createElement("ul");item.links.forEach(entry=>{const li=document.createElement("li"),a=document.createElement("a");a.href=entry.href.startsWith("/")?`https://fjucflvd.wixsite.com${entry.href}`:entry.href;a.textContent=entry.text||entry.href;if(/^https:\/\//i.test(a.href)){a.target="_blank";a.rel="noopener noreferrer"}li.append(a);list.append(li)});section.append(h,list);target.append(section)}
    if(item.source!=="本機 Wix 備份"&&item.links?.length){const source=document.createElement("a");source.className="text-link";source.href=item.links[0].href;source.target="_blank";source.rel="noopener noreferrer";source.textContent="前往 Wix 原始頁面查看完整內容 →";target.append(source)}
  }

  function initMenu(){
    const toggle=document.querySelector(".menu-toggle"),nav=document.getElementById("primary-nav");if(!toggle||!nav)return;
    const close=()=>{toggle.setAttribute("aria-expanded","false");nav.classList.remove("is-open")};
    toggle.addEventListener("click",()=>{const expanded=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!expanded));nav.classList.toggle("is-open",!expanded)});
    nav.addEventListener("click",event=>{if(event.target.closest("a"))close()});document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});
  }

  function initSettings(){
    const settings=window.GCTI_SETTINGS||{};
    document.querySelectorAll("[data-setting]").forEach(el=>{const key=el.dataset.setting;if(settings[key]===undefined)return;el.textContent=settings[key];if(key.endsWith("Email"))el.href="mailto:"+settings[key]});
  }

  function init(){document.querySelectorAll("#copyright-year").forEach(el=>el.textContent=String(new Date().getFullYear()));initSettings();initMenu();const page=document.body.dataset.page;if(page==="home")initHome();if(page==="news")initArchive();if(page==="post")initPost();if(page==="content")initContent()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
