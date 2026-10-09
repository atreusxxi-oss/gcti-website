(function(){
  "use strict";
  const tree=window.GCTI_NAV||[];
  const settings=window.GCTI_SETTINGS||{};
  const base=document.body.dataset.page==="home"?"":"../";
  const slot=document.getElementById("site-header-slot");
  if(!slot)return;
  const route=item=>item.slug?`${base}pages/page.html?slug=${encodeURIComponent(item.slug)}`:`${base}${item.href||"#"}`;
  const external=value=>/^https?:\/\//i.test(String(value||""))?String(value):"#";
  const branch=item=>{
    const li=document.createElement("li");li.className="menu-item";
    if(item.children){
      li.classList.add("has-submenu");
      const button=document.createElement("button");button.type="button";button.className="menu-parent";button.textContent=item.label;button.setAttribute("aria-expanded","false");
      const list=document.createElement("ul");list.className="submenu";item.children.forEach(child=>list.append(branch(child)));
      button.addEventListener("click",()=>{const open=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!open));li.classList.toggle("submenu-open",!open)});li.append(button,list);
    }else{
      const a=document.createElement("a");a.href=route(item);a.textContent=item.label;
      const slug=new URLSearchParams(location.search).get("slug");
      if(item.slug&&item.slug===slug){a.classList.add("is-current");a.setAttribute("aria-current","page")}
      if(item.href==="news/index.html"&&document.body.dataset.page==="news"){a.classList.add("is-current");a.setAttribute("aria-current","page")}
      li.append(a);
    }
    return li;
  };
  const header=document.createElement("header");header.className="site-header";
  header.innerHTML=`<div class="brand-row wrap"><a class="brand" href="${base}index.html" aria-label="輔仁大學科創學程 GCTI 首頁"><img src="${base}assets/images/gcti-logo.png" alt="輔仁大學科創學程 GCTI"></a><div class="header-tools"><div class="social-links" aria-label="社群媒體"><a href="${external(settings.schoolUrl||'https://www.fju.edu.tw/')}" target="_blank" rel="noopener noreferrer"><svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 8.8 12 2.7l11 6.1-11 6.1L1 8.8Z"/><path d="M5 11.3v5.2c3.8 2.8 10.2 2.8 14 0v-5.2l-7 3.9-7-3.9Z"/><path d="M22 9v6.1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="22" cy="16.2" r="1.2"/></svg><span>輔仁大學</span></a><a href="${external(settings.facebookUrl)}" target="_blank" rel="noopener noreferrer"><svg class="social-icon social-icon-facebook" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path class="icon-cutout" d="M13.4 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4h1.5V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v1.8H7.7V13h2.4v7h3.3Z"/></svg><span>Facebook</span></a><a href="${external(settings.instagramUrl)}" target="_blank" rel="noopener noreferrer"><svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.6" cy="6.6" r="1.2"/></svg><span>Instagram</span></a><a href="${external(settings.youtubeUrl)}" target="_blank" rel="noopener noreferrer"><svg class="social-icon social-icon-youtube" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4.5" width="20" height="15" rx="4"/><path class="youtube-play" d="m10 8 6 4-6 4V8Z"/></svg><span>YouTube</span></a></div><form class="site-search" role="search" action="${base}news/index.html"><label class="sr-only" for="site-search">搜尋網站消息</label><input id="site-search" name="q" type="search" placeholder="搜尋…"><button aria-label="搜尋" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4.2 4.2"/></svg></button></form></div><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span class="sr-only">開啟導覽選單</span><i></i><i></i></button></div><div class="nav-band"><nav id="primary-nav" class="primary-nav wrap" aria-label="主要導覽"><ul class="menu-list"></ul></nav></div>`;
  tree.forEach(item=>header.querySelector(".menu-list").append(branch(item)));
  slot.replaceWith(header);
})();
