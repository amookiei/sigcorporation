(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const data = window.SIG_CONTENT;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assets = file => 'assets/' + file;
  const external = 'target="_blank" rel="noopener"';
  const header = $('.site-header');
  const menu = $('.menu-toggle');
  const nav = $('#main-nav');
  function closeMenu(){ if(!menu) return; menu.setAttribute('aria-expanded','false'); nav.classList.remove('is-open'); $('.sr-only',menu).textContent='메뉴 열기'; }
  menu?.addEventListener('click', () => {const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);$('.sr-only',menu).textContent=open?'메뉴 닫기':'메뉴 열기';});
  nav?.addEventListener('click', e => {if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown', e => {if(e.key==='Escape' && nav?.classList.contains('is-open')){closeMenu();menu.focus();}});
  window.matchMedia('(min-width: 901px)').addEventListener('change',closeMenu);
  if($('#business-grid')){
    $('#business-grid').innerHTML=data.business.map((item,i)=>`<button class="business-card" data-business="${i}" aria-haspopup="dialog"><span class="business-picture"><img src="${assets(item.image)}" alt="" width="640" height="640" loading="lazy"></span><span class="business-title">${escape(item.title)}</span></button>`).join('');
    $('#partner-grid').innerHTML=['현대건설','가톨릭대학교 서울성모병원','서대문구청','주식회사 하이','중소벤처기업진흥공단','이마트','신용보증기금','씨엔티테크','서울여자간호대학교','헥토헬스케어'].map((name,i)=>`<img src="assets/partner-${i+1}.svg" alt="${name}" loading="lazy" width="220" height="64">`).join('');
    const dialog=$('#business-dialog');
    $('#business-grid').addEventListener('click',e=>{const b=e.target.closest('[data-business]');if(!b)return;const item=data.business[+b.dataset.business];$('#dialog-title').textContent=item.title.replace('\n',' ');$('#dialog-description').textContent=item.detail;$('#dialog-visual').src=assets(item.visual);$('#dialog-visual').alt=item.title.replace('\n',' ')+' 관련 시니허그 제품 화면';dialog.showModal();document.body.classList.add('modal-open');});
    $('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
    const trademarkTypes=[['09','비의료용 생체신호 측정기기·센서 및 모니터링 앱'],['42','생체신호·수면 분석 소프트웨어, SaaS 및 IoT 원격관리'],['44','의료 목적 원격 모니터링·건강관리 및 생체정보 분석'],['45','의료 경보 감시·긴급상황 알림 및 안전 모니터링'],['10','의료용 심박·호흡·생체신호 측정기기 및 환자 모니터링 장치']];
    $('#trademark-rows').innerHTML=[0,1,2,3,4,0,1,2,0,1,1].map((t,i)=>`<tr><td>40-2026-02030${63+i}</td><td>제${trademarkTypes[t][0]}류</td><td>${trademarkTypes[t][1]}</td></tr>`).join('');
  }
  if($('.hero')){
    const slides=$$('.hero-slide');let active=0,timer=null,playing=false;
    function showSlide(n){active=(n+slides.length)%slides.length;slides.forEach((s,i)=>{const on=i===active;s.classList.toggle('is-active',on);s.setAttribute('aria-hidden',String(!on));s.inert=!on;});$('#slide-current').textContent=String(active+1).padStart(2,'0');$('.slide-track i').style.transform=`translateX(${active*100}%)`;}
    function stopTimer(){clearInterval(timer);timer=null;}
    function startTimer(){stopTimer();if(playing&&!document.hidden&&!reduced.matches)timer=setInterval(()=>showSlide(active+1),6500);}
    $('#hero-prev').addEventListener('click',()=>{showSlide(active-1);startTimer();});$('#hero-next').addEventListener('click',()=>{showSlide(active+1);startTimer();});
    $('#hero-play').addEventListener('click',()=>{playing=!playing;$('#hero-play').setAttribute('aria-pressed',String(playing));$('#hero-play').setAttribute('aria-label',playing?'자동 재생 정지':'자동 재생 시작');$('#hero-play').textContent=playing?'Ⅱ':'▶';startTimer();});
    $('.hero').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showSlide(active+(e.key==='ArrowRight'?1:-1));startTimer();}});
    $('.hero').addEventListener('mouseenter',stopTimer);$('.hero').addEventListener('mouseleave',startTimer);$('.hero').addEventListener('focusin',stopTimer);$('.hero').addEventListener('focusout',startTimer);document.addEventListener('visibilitychange',startTimer);
    reduced.addEventListener('change',startTimer);
    showSlide(0);
  }
  let updateHistory=()=>{};
  if($('#history-list')){
    $('#history-list').insertAdjacentHTML('beforeend',data.history.map((item,i)=>`<section class="history-year${i===0?' is-active':''}" id="year-${item.year}" data-year="${item.year}" aria-labelledby="heading-${item.year}"><div class="history-year-label"><h3 id="heading-${item.year}">${item.year}</h3><p>${escape(item.caption)}</p></div><dl>${item.events.map(([month,text])=>`<div class="history-event"><dt>${month}</dt><dd>${escape(text)}</dd></div>`).join('')}</dl></section>`).join(''));
    const years=$$('.history-year'),links=$$('.year-nav a');let current=-1;
    updateHistory=()=>{const target=Math.min(window.innerHeight*.38,320);let next=0;years.forEach((year,i)=>{if(year.getBoundingClientRect().top<=target)next=i;});const list=$('#history-list').getBoundingClientRect();const progress=Math.min(1,Math.max(0,(target-list.top)/list.height));$('#history-list').style.setProperty('--history-progress',String(progress));if(next===current)return;current=next;years.forEach((y,i)=>y.classList.toggle('is-active',i===next));links.forEach((a,i)=>{a.classList.toggle('is-active',i===next);if(i===next)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});};
    links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const section=document.getElementById(a.hash.slice(1));const gap=header.offsetHeight+$('.year-nav').offsetHeight+28;window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-gap,behavior:reduced.matches?'instant':'smooth'});}));
  }
  if($('#news-grid')){
    function renderNews(filter='전체'){const news=data.news.filter(n=>filter==='전체'||n.category===filter);$('#news-grid').innerHTML=news.map(n=>`<article class="news-card"><a class="news-image" href="news.html?id=${n.id}" tabindex="-1" aria-hidden="true"><img class="${n.fit}" src="${assets(n.image)}" alt="${escape(n.caption)}" width="700" height="330" loading="lazy"></a><div class="news-card-content"><p class="news-meta">${n.category} · <time>${n.date}</time></p><h3><a href="news.html?id=${n.id}">${escape(n.title)}</a></h3><p class="summary">${escape(n.summary)}</p><a class="news-source" href="${n.url||'news.html?id='+n.id}" ${n.url?external:''}>${n.source} <span aria-hidden="true">↗</span><span class="sr-only">${n.url?' 원문 새 창으로 보기':' 상세 보기'}</span></a></div></article>`).join('');$('#news-status').textContent=`${filter} ${news.length}건`;}
    $$('.news-filters button').forEach(b=>b.addEventListener('click',()=>{$$('.news-filters button').forEach(x=>{const on=x===b;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on));});renderNews(b.dataset.filter); revealNews();}));renderNews();
  }
  if($('#news-detail')){
    const item=data.news.find(n=>n.id===new URLSearchParams(location.search).get('id'));
    if(!item){document.title='소식을 찾을 수 없습니다 | 시그코퍼레이션';$('#news-detail').innerHTML='<h1>소식을 찾을 수 없습니다.</h1><p>주소를 확인하거나 소식 목록에서 다시 선택해 주세요.</p><div class="detail-actions"><a class="button" href="index.html#news">소식 목록으로 ↗</a></div>';}
    else{document.title=item.title+' | 시그코퍼레이션';$('meta[name="description"]').content=item.summary;$('#news-detail').innerHTML=`<p class="eyebrow">SIG CORPORATION · NEWSROOM</p><h1>${escape(item.title)}</h1><div class="detail-meta"><span>${item.category}</span><time>${item.date}</time><span>${item.source}</span></div><figure class="detail-figure"><img src="${assets(item.image)}" alt="${escape(item.caption)}"><figcaption>${escape(item.caption)}</figcaption></figure><div class="detail-body">${item.body.map(p=>`<p>${escape(p)}</p>`).join('')}${item.url?'<p class="detail-note">위 내용은 보도의 주요 내용을 요약한 것입니다. 전체 기사는 아래 원문에서 확인하실 수 있습니다.</p>':''}<div class="detail-actions"><a class="button" href="index.html#news">← 소식 목록으로</a>${item.url?`<a class="button" href="${item.url}" ${external}>전자신문 원문 보기 <span>↗</span></a>`:'<a class="button" href="https://www.senihug.com/contact" '+external+'>사업 협력 문의 <span>↗</span></a>'}</div></div>`;}
  }

  // Native scrolling only. Entrance effects never intercept wheel/touch input.
  let motionObserver=null;
  function revealElement(el,delay=0){
    if(reduced.matches||!motionObserver)return;
    el.style.setProperty('--reveal-delay',delay+'ms');el.classList.add('motion-reveal');motionObserver.observe(el);
  }
  function revealNews(){if(!motionObserver)return;$$('.news-card').forEach((el,i)=>revealElement(el,(i%3)*85));}
  if('IntersectionObserver' in window&&!reduced.matches){
    motionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');motionObserver.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -32px 0px'});
    $$('.section-heading').forEach(group=>[...group.children].forEach((el,i)=>revealElement(el,i*95)));
    $$('.section-banner').forEach(banner=>{[...banner.children].forEach((el,i)=>revealElement(el,i*100));});
    $$('.business-card').forEach((el,i)=>revealElement(el,(i%4)*95));
    $$('.partner-grid img').forEach((el,i)=>revealElement(el,(i%5)*70));
    $$('.proof-content h3').forEach(el=>revealElement(el));
    $$('.proof-table').forEach(table=>{$$('thead',table).forEach(el=>revealElement(el));$$('tbody tr',table).forEach((el,i)=>revealElement(el,(i%3)*75));});
    $$('.history-event').forEach(el=>revealElement(el));
    $$('.news-heading,.history-next,.location-section h2,.location-card,.footer-top').forEach((el,i)=>revealElement(el,(i%2)*80));
    revealNews();
    const bannerObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('banner-entered');bannerObserver.unobserve(e.target);}}),{threshold:.1});
    $$('.section-banner').forEach(el=>bannerObserver.observe(el));
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){motionObserver?.disconnect();$$('.motion-reveal').forEach(el=>el.classList.add('is-visible'));}});

  let ticking=false;
  function update(){ticking=false;header.classList.toggle('scrolled',window.scrollY>15);document.documentElement.style.setProperty('--page-progress',String(window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)));$('.back-top')?.classList.toggle('visible',window.scrollY>650);updateHistory();}
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});window.addEventListener('resize',update);window.addEventListener('load',()=>{update();if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target)window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-header.offsetHeight-24,behavior:'instant'});}});update();
  $('.back-top')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));
})();
