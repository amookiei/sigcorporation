/* 홈페이지 관리자.
   서버나 DB 없이 동작합니다. 로그인한 사람의 GitHub 토큰으로 저장소의 content.js 와 assets/ 이미지를 직접 커밋하고,
   커밋되면 Vercel 이 자동으로 다시 배포합니다(보통 1~2분). */
(() => {
  'use strict';
  const CONFIG = { owner: 'amookiei', repo: 'sigcorporation', base: 'SIG_Corporation_Web_v2', api: 'https://api.github.com' };
  const TOKEN_KEY = 'sig-admin-token';
  const $ = (s, p = document) => p.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); }
    kids.flat().forEach(c => c != null && n.append(c));
    return n;
  };
  const repoPath = `/repos/${CONFIG.owner}/${CONFIG.repo}`;
  let token = '', branch = '', data = null, loadedSha = '', dirty = false, current = 'hero';
  const pending = new Map();      // 아직 올리지 않은 새 이미지: 파일명 → { blob, url }
  const openCards = new Set();    // 펼쳐 둔 카드 기억

  // ---------------- GitHub ----------------
  async function gh(path, opt = {}) {
    const res = await fetch(CONFIG.api + path, { ...opt, headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
    if (!res.ok) { const body = await res.json().catch(() => ({})); const err = new Error(body.message || res.statusText); err.status = res.status; throw err; }
    return res.status === 204 ? null : res.json();
  }
  const post = (path, body, method = 'POST') => gh(path, { method, body: JSON.stringify(body) });
  const decode = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
  const toBase64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });

  async function load() {
    const file = await gh(`${repoPath}/contents/${CONFIG.base}/content.js?ref=${encodeURIComponent(branch)}`);
    const text = decode(file.content);
    const start = text.indexOf('{', text.indexOf('window.SIG_CONTENT'));
    data = JSON.parse(text.slice(start, text.lastIndexOf('}') + 1));
    loadedSha = file.sha; pending.clear(); setDirty(false);
  }
  const serialize = () => '/* 사이트 내용 파일입니다. 관리자 페이지(/admin)에서 저장하면 이 파일이 통째로 새로 만들어집니다.\n   직접 고칠 때는 JSON 형식(큰따옴표, 마지막 항목 뒤 쉼표 없음)을 지켜 주세요. *_en 은 영문 화면에 쓰이는 번역입니다. */\nwindow.SIG_CONTENT = ' + JSON.stringify(data, null, 2) + ';\n';

  async function save() {
    const problem = validate(); if (problem) { toast(problem, true); return; }
    const button = $('#save'); button.disabled = true; setStatus('저장하는 중…');
    try {
      const now = await gh(`${repoPath}/contents/${CONFIG.base}/content.js?ref=${encodeURIComponent(branch)}`);
      if (now.sha !== loadedSha && !confirm('불러온 뒤에 다른 사람이 내용을 저장했습니다.\n계속하면 그 변경을 덮어씁니다. 계속할까요?\n\n(취소한 뒤 새로고침하면 최신 내용을 불러옵니다.)')) { setDirty(true); return; }
      const ref = await gh(`${repoPath}/git/ref/heads/${branch}`);
      const head = await gh(`${repoPath}/git/commits/${ref.object.sha}`);
      const json = JSON.stringify(data), tree = [{ path: `${CONFIG.base}/content.js`, mode: '100644', type: 'blob', content: serialize() }];
      let n = 0; const used = [...pending].filter(([name]) => json.includes(JSON.stringify(name)));
      for (const [name, file] of used) {
        setStatus(`이미지 올리는 중… (${++n}/${used.length})`);
        const blob = await post(`${repoPath}/git/blobs`, { content: await toBase64(file.blob), encoding: 'base64' });
        tree.push({ path: `${CONFIG.base}/assets/${name}`, mode: '100644', type: 'blob', sha: blob.sha });
      }
      setStatus('저장하는 중…');
      const newTree = await post(`${repoPath}/git/trees`, { base_tree: head.tree.sha, tree });
      const commit = await post(`${repoPath}/git/commits`, { message: 'Update site content via admin page', tree: newTree.sha, parents: [ref.object.sha] });
      await post(`${repoPath}/git/refs/heads/${branch}`, { sha: commit.sha }, 'PATCH');
      await load(); render();
      toast('저장했습니다. 1~2분 뒤 홈페이지에 반영됩니다.');
    } catch (e) {
      setDirty(true);
      toast(e.status === 401 ? '토큰이 만료됐거나 올바르지 않습니다. 다시 로그인해 주세요.' : e.status === 403 || e.status === 404 ? '이 토큰에는 저장 권한이 없습니다. Contents: Read and write 권한을 확인해 주세요.' : '저장하지 못했습니다: ' + e.message, true);
    }
  }

  function validate() {
    const ids = new Set();
    for (const n of data.news) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(n.id || '')) return `뉴스 "${n.title || '(제목 없음)'}"의 주소용 ID는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.`;
      if (ids.has(n.id)) return `뉴스 주소용 ID "${n.id}"가 중복됩니다.`;
      ids.add(n.id);
      if (!n.title) return '제목이 비어 있는 뉴스가 있습니다.';
      if (n.url && !/^https?:\/\//.test(n.url)) return `뉴스 "${n.title}"의 원문 링크는 https:// 로 시작해야 합니다.`;
    }
    for (const y of data.history) if (!/^\d{4}$/.test(y.year || '')) return '연혁의 연도는 네 자리 숫자로 입력해 주세요.';
    return '';
  }

  // ---------------- 이미지 ----------------
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
  async function toWebp(source, width, height, fallbackType) {
    const canvas = el('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(source, 0, 0, width, height);
    let blob = await new Promise(ok => canvas.toBlob(ok, 'image/webp', .86));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise(ok => canvas.toBlob(ok, fallbackType === 'image/png' ? 'image/png' : 'image/jpeg', .9));
    return blob;
  }
  /** 고른 파일을 웹용으로 줄여 대기 목록에 넣고 파일명을 돌려준다. */
  async function addImage(file, { maxWidth = 2000, small = 0 } = {}) {
    const name = slug(file.name.replace(/\.[^.]+$/, '')), stamp = Date.now().toString(36);
    const put = (fileName, blob) => { pending.set(fileName, { blob, url: URL.createObjectURL(blob) }); return fileName; };
    if (file.type === 'image/svg+xml') return { name: put(`${name}-${stamp}.svg`, file), width: 0, height: 0 };
    if (!file.type.startsWith('image/')) throw new Error('이미지 파일(JPG, PNG, WebP, SVG)만 올릴 수 있습니다. PDF는 이미지로 저장한 뒤 올려 주세요.');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width), width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
    const blob = await toWebp(bitmap, width, height, file.type), ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    const out = { name: put(`${name}-${stamp}.${ext}`, blob), width, height };
    if (small && width > small) { const b = await toWebp(bitmap, small, Math.round(bitmap.height * small / bitmap.width), file.type); out.small = put(`${name}-${stamp}-${small}.${ext}`, b); }
    return out;
  }
  const imageUrl = name => !name ? '' : pending.has(name) ? pending.get(name).url : '/assets/' + name;

  // ---------------- 입력 요소 ----------------
  function input(obj, key, f, tag) {
    const isEn = key.endsWith('_en');
    const get = () => f.type === 'lines' ? (obj[key] || []).join('\n') : f.type === 'paras' ? (obj[key] || []).join('\n\n') : (obj[key] ?? '');
    const set = v => { obj[key] = f.type === 'lines' ? v.split('\n').map(x => x.trim()).filter(Boolean) : f.type === 'paras' ? v.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean) : v; };
    let control;
    if (f.type === 'select') control = el('select', {}, f.options.map(([value, label]) => el('option', { value, selected: value === get() }, label)));
    else if (f.type === 'text') control = el('input', { type: 'text', value: get(), placeholder: isEn ? '영문 (비우면 영문 화면에 한국어로 표시)' : (f.placeholder || '') });
    else { control = el('textarea', { rows: f.rows || (f.type === 'paras' ? 6 : 3), placeholder: isEn ? '영문 (비우면 영문 화면에 한국어로 표시)' : (f.placeholder || '') }); control.value = get(); }
    const box = el('div', { class: 'input' + (isEn ? ' is-en' : '') }, control, tag ? el('span', {}, tag) : null);
    const mark = () => box.classList.toggle('is-empty-en', isEn && !String(get()).trim() && /[가-힣]/.test(JSON.stringify(obj[key.slice(0, -3)] || '')));
    control.addEventListener(f.type === 'select' ? 'change' : 'input', () => { set(control.value); mark(); setDirty(true); });
    mark();
    return box;
  }

  function imageField(obj, f) {
    const wrap = el('div', { class: 'image' });
    const draw = () => {
      const name = obj[f.k];
      wrap.replaceChildren(...[
        el('div', { class: 'image-thumb', style: name ? `background-image:url("${imageUrl(name)}")` : '' }),
        el('div', { class: 'image-info' }, el('b', {}, name || '이미지 없음'), pending.has(name) ? el('span', { class: 'is-new' }, `새 이미지 · ${(pending.get(name).blob.size / 1024).toFixed(0)}KB · 저장하면 올라갑니다`) : el('span', {}, f.spec || '')),
        el('label', { class: 'btn small' }, '이미지 바꾸기', el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async e => {
          const file = e.target.files[0]; if (!file) return;
          try {
            const res = await addImage(file, { maxWidth: f.maxWidth, small: f.small && obj.kind === 'photo' ? f.small : 0 });
            obj[f.k] = res.name;
            if (f.dims) { obj.imageW = res.width; obj.imageH = res.height; if (res.small) obj.imageSmall = res.small; else delete obj.imageSmall; }
            setDirty(true); draw();
          } catch (err) { toast(err.message, true); }
        } })),
        f.optional && name ? el('button', { class: 'btn small danger', type: 'button', onclick: () => { obj[f.k] = ''; setDirty(true); draw(); } }, '빼기') : null
      ].filter(Boolean));
    };
    draw(); return wrap;
  }

  function listField(obj, f, pathKey) {
    const arr = obj[f.k] || (obj[f.k] = []);
    const wrap = el('div', { class: 'list' });
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; openCards.clear(); setDirty(true); draw(); };
    const draw = () => {
      wrap.replaceChildren(...arr.map((item, i) => {
        const id = `${pathKey}.${i}`, title = el('span', { class: 'card-title' }, f.itemLabel(item, i));
        const stop = fn => e => { e.preventDefault(); e.stopPropagation(); fn(); };
        const card = el('details', { class: 'card', open: openCards.has(id) },
          el('summary', {}, title, f.fixed ? null : el('span', { class: 'card-actions' },
            el('button', { class: 'btn small', type: 'button', title: '위로', 'aria-label': '위로 이동', onclick: stop(() => move(i, -1)) }, '↑'),
            el('button', { class: 'btn small', type: 'button', title: '아래로', 'aria-label': '아래로 이동', onclick: stop(() => move(i, 1)) }, '↓'),
            el('button', { class: 'btn small danger', type: 'button', onclick: stop(() => { if (!confirm(`"${f.itemLabel(item, i)}" 항목을 삭제할까요?`)) return; arr.splice(i, 1); openCards.clear(); setDirty(true); draw(); }) }, '삭제'))),
          el('div', { class: 'card-body' }, fields(item, f.fields, id)));
        card.addEventListener('toggle', () => card.open ? openCards.add(id) : openCards.delete(id));
        card.addEventListener('input', () => { title.textContent = f.itemLabel(item, i); });
        return card;
      }), f.fixed ? '' : el('button', { class: 'btn list-add', type: 'button', onclick: () => { if (f.addFirst) { arr.unshift(f.create()); openCards.clear(); openCards.add(`${pathKey}.0`); } else { arr.push(f.create()); openCards.add(`${pathKey}.${arr.length - 1}`); } setDirty(true); draw(); } }, '＋ ' + (f.addLabel || '항목 추가')));
    };
    draw(); return wrap;
  }

  function fields(obj, defs, pathKey) {
    return defs.filter(f => !f.when || f.when(obj)).map(f => {
      const body = f.type === 'image' ? imageField(obj, f) : f.type === 'list' ? listField(obj, f, pathKey + '.' + f.k)
        : el('div', { class: 'field-row' }, input(obj, f.k, f, f.en ? 'KR' : ''), f.en ? input(obj, f.k + '_en', f, 'EN') : null);
      return el('div', { class: 'field' + (f.en ? ' is-bi' : '') }, el('span', { class: 'field-label' }, f.label), f.hint ? el('p', { class: 'field-hint' }, f.hint) : null, body);
    });
  }

  // ---------------- 편집 구간 정의 ----------------
  const first = s => String(s || '').split('\n')[0];
  const proofFields = titleLabel => [
    { k: 'title', label: titleLabel, type: 'text', en: true },
    { k: 'lines', label: '번호 · 부가 정보', type: 'lines', rows: 2, hint: '한 줄에 하나씩. 예) 제10-2973759호 / 출원번호 10-2025-0062027 — 번호 형식은 영문으로 자동 변환됩니다.' },
    { k: 'authority', label: '기관', type: 'text', en: true }, { k: 'date', label: '일자', type: 'text', placeholder: '2026-06-01' }, { k: 'status', label: '구분', type: 'text', en: true }
  ];
  const SECTIONS = [
    { id: 'hero', title: '메인 슬라이드', desc: '첫 화면의 슬라이드 3장입니다. 제목과 설명에서 Enter로 줄을 나눌 수 있습니다.', list: { fixed: true, itemLabel: (x, i) => `슬라이드 ${i + 1} — ${first(x.title)}`, fields: [
      { k: 'eyebrow', label: '작은 머리글 (제목 위 영문 문구, 비워도 됨)', type: 'text', when: x => x.kind !== 'photo' },
      { k: 'title', label: '제목', type: 'area', rows: 2, en: true }, { k: 'text', label: '설명', type: 'area', rows: 2, en: true },
      { k: 'button', label: '버튼 문구', type: 'text', en: true }, { k: 'link', label: '버튼 링크', type: 'text', hint: '외부 주소(https://…) 또는 페이지 안 위치(#business, #contact 등)' },
      { k: 'image', label: '이미지', type: 'image', dims: true, small: 1920, maxWidth: 3840, spec: '1번: 가로 사진 2880px 이상(비율 1.8:1), 인물은 오른쪽 · 2~3번: 투명 배경 PNG, 여백 없이' },
      { k: 'imageMobile', label: '모바일용 세로 이미지', type: 'image', maxWidth: 1350, when: x => x.kind === 'photo', spec: '세로 사진 1080px 이상(비율 약 2:3)' },
      { k: 'alt', label: '이미지 설명 (시각장애인용 · 검색용)', type: 'text', en: true }
    ] } },
    { id: 'about', title: '회사 소개', desc: '슬라이드 바로 아래의 소개 문구입니다.', fields: [{ k: 'title', label: '제목', type: 'area', rows: 2, en: true }, { k: 'text', label: '소개 문단', type: 'area', rows: 4, en: true }] },
    { id: 'business', title: '사업영역', desc: '육각형 카드입니다. 4개 단위로 한 줄을 이룹니다.', list: { itemLabel: x => String(x.title || '새 항목').replace('\n', ' '), addLabel: '사업영역 추가', create: () => ({ title: '', title_en: '', detail: '', detail_en: '', image: '', visual: '' }), fields: [
      { k: 'title', label: '이름 (두 줄 권장)', type: 'area', rows: 2, en: true }, { k: 'detail', label: '팝업 설명', type: 'area', rows: 3, en: true },
      { k: 'image', label: '육각형 사진', type: 'image', maxWidth: 800, spec: '정사각형 640px 이상' }, { k: 'visual', label: '팝업 이미지', type: 'image', maxWidth: 1600, spec: '가로형, 투명 또는 밝은 배경' }
    ] } },
    { id: 'partners', title: '협력 기관 로고', desc: '5개 단위로 한 줄을 이룹니다.', list: { itemLabel: x => x.name || '새 기관', addLabel: '기관 추가', create: () => ({ name: '', name_en: '', image: '' }), fields: [
      { k: 'name', label: '기관명', type: 'text', en: true }, { k: 'image', label: '로고', type: 'image', maxWidth: 600, spec: 'SVG 권장, 또는 투명 배경 PNG(가로 440px 이상)' }
    ] } },
    { id: 'patents', title: '등록 특허', list: { itemLabel: x => x.title || '새 특허', addLabel: '특허 추가', create: () => ({ title: '', title_en: '', lines: [], authority: '', authority_en: '', date: '', status: '등록', status_en: 'Registered' }), fields: proofFields('특허 명칭') } },
    { id: 'patentHighlights', title: '특허 핵심', desc: '강조할 부분은 **이렇게** 별표 두 개로 감싸면 굵게 표시됩니다.', list: { itemLabel: x => x.number || '새 항목', addLabel: '항목 추가', create: () => ({ number: '', text: '', text_en: '' }), fields: [
      { k: 'number', label: '등록번호', type: 'text', placeholder: '제10-0000000호' }, { k: 'text', label: '핵심 내용', type: 'area', rows: 3, en: true }
    ] } },
    { id: 'certifications', title: '인증', list: { itemLabel: x => x.title || '새 인증', addLabel: '인증 추가', create: () => ({ title: '', title_en: '', lines: [], authority: '', authority_en: '', date: '', status: '인증', status_en: 'Certified' }), fields: proofFields('항목') } },
    { id: 'trademarks', title: '상표 출원', list: { itemLabel: x => `${x.number || '새 상표'} · 제${x.classNo || '?'}류`, addLabel: '상표 추가', create: () => ({ number: '', classNo: '', summary: '', summary_en: '' }), fields: [
      { k: 'number', label: '출원 번호', type: 'text', placeholder: '40-2026-0000000' }, { k: 'classNo', label: '상품류 (숫자만)', type: 'text', placeholder: '09' }, { k: 'summary', label: '출원 분야 요약', type: 'text', en: true }
    ] } },
    { id: 'certificates', title: '인증서 이미지', desc: '3개 단위로 한 줄을 이룹니다. PDF는 이미지(PNG·JPG)로 저장한 뒤 올려 주세요.', list: { itemLabel: x => [x.name, x.number].filter(Boolean).join(' ') || '새 인증서', addLabel: '인증서 추가', create: () => ({ name: '', name_en: '', number: '', image: '' }), fields: [
      { k: 'name', label: '이름', type: 'text', en: true }, { k: 'number', label: '번호', type: 'text', placeholder: '제0000-00000호' }, { k: 'note', label: '부가 설명 (크게 볼 때만 표시, 비워도 됨)', type: 'text', en: true },
      { k: 'image', label: '인증서 이미지', type: 'image', maxWidth: 1100, spec: 'A4 세로 비율, 가로 1100px 이상' }
    ] } },
    { id: 'history', title: '연혁', desc: '위에 있는 연도가 먼저 나옵니다. 최신 연도를 맨 위에 두세요.', list: { itemLabel: x => `${x.year || '새 연도'} — ${x.caption || ''}`, addLabel: '연도 추가', addFirst: true, create: () => ({ year: String(new Date().getFullYear()), caption: '', caption_en: '', events: [] }), fields: [
      { k: 'year', label: '연도', type: 'text' }, { k: 'caption', label: '연도 아래 한 줄 문구', type: 'text', en: true },
      { k: 'events', label: '항목', type: 'list', itemLabel: x => `${x.month || '--'}월 · ${first(x.text)}`, addLabel: '항목 추가', addFirst: true, create: () => ({ month: '', text: '', text_en: '' }), fields: [
        { k: 'month', label: '월 (두 자리)', type: 'text', placeholder: '03' }, { k: 'text', label: '내용', type: 'area', rows: 2, en: true }
      ] }
    ] } },
    { id: 'next', title: '예정 일정 (Next)', desc: '연혁 맨 아래 점선으로 이어지는 예정 일정입니다. 항목을 모두 지우면 이 구간이 숨겨집니다.', fields: [
      { k: 'label', label: '설명 문구', type: 'text', en: true },
      { k: 'items', label: '일정', type: 'list', itemLabel: x => `${x.date || '----.--'} · ${x.text || ''}`, addLabel: '일정 추가', create: () => ({ date: '', text: '', text_en: '' }), fields: [
        { k: 'date', label: '시기', type: 'text', placeholder: '2027.01' }, { k: 'text', label: '내용', type: 'text', en: true }
      ] }
    ] },
    { id: 'news', title: '뉴스', desc: '위에 있는 글이 먼저 나옵니다. 본문은 빈 줄로 문단을 나눕니다.', list: { itemLabel: x => `${x.date || ''} · ${x.title || '새 글'}`, addLabel: '새 글 쓰기', addFirst: true,
      create: () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return { id: 'news-' + Date.now().toString(36), category: '기업 소식', date: `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`, title: '', title_en: '', summary: '', summary_en: '', image: '', fit: 'cover', source: 'SIG Corporation', source_en: '', url: '', caption: '', caption_en: '', body: [], body_en: [] }; },
      fields: [
        { k: 'category', label: '분류', type: 'select', options: [['기업 소식', '기업 소식'], ['언론 보도', '언론 보도']] }, { k: 'date', label: '날짜', type: 'text', placeholder: '2026.11.24' },
        { k: 'title', label: '제목', type: 'area', rows: 2, en: true }, { k: 'summary', label: '요약 (목록에 보이는 한두 문장)', type: 'area', rows: 2, en: true },
        { k: 'body', label: '본문', type: 'paras', en: true, hint: '빈 줄로 문단을 나눕니다. 외부 기사는 전문을 옮기지 말고 직접 쓴 요약을 넣어 주세요.' },
        { k: 'image', label: '대표 이미지', type: 'image', maxWidth: 1600, spec: '가로형 1400px 이상(비율 약 2:1)' },
        { k: 'fit', label: '이미지 맞춤', type: 'select', options: [['cover', '칸에 꽉 채우기 (사진)'], ['contain', '전체가 보이게 (로고·제품 컷)']] },
        { k: 'caption', label: '이미지 설명', type: 'text', en: true },
        { k: 'source', label: '출처 (매체명)', type: 'text', en: true, hint: '자체 소식이면 SIG Corporation' },
        { k: 'url', label: '원문 링크 (외부 기사일 때만)', type: 'text', placeholder: 'https://' },
        { k: 'id', label: '주소용 ID (영문 소문자·숫자·하이픈)', type: 'text', hint: '상세 페이지 주소에 쓰입니다. 이미 공유된 글은 바꾸지 마세요.' }
      ] } }
  ];

  // ---------------- 화면 ----------------
  function render() {
    $('#sidebar').replaceChildren(...SECTIONS.map(s => el('button', { type: 'button', class: s.id === current ? 'is-active' : '', onclick: () => { current = s.id; openCards.clear(); render(); window.scrollTo(0, 0); } }, s.title)));
    const s = SECTIONS.find(x => x.id === current);
    const body = s.list ? listField(data, { k: s.id, ...s.list }, s.id) : el('div', { class: 'panel' }, fields(data[s.id] || (data[s.id] = {}), s.fields, s.id));
    $('#editor').replaceChildren(el('h1', {}, s.title), el('p', { class: 'desc' }, s.desc || ''), body);
  }
  function setDirty(v) { dirty = v; $('#save').disabled = !v; setStatus(v ? '저장하지 않은 변경이 있습니다' : `${CONFIG.owner}/${CONFIG.repo} · ${branch}`); $('#status').classList.toggle('is-dirty', v); }
  function setStatus(text) { $('#status').textContent = text; }
  let toastTimer;
  function toast(text, error) { const t = $('#toast'); t.textContent = text; t.classList.toggle('is-error', !!error); t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, error ? 8000 : 5000); }

  async function connect(value, remember) {
    token = value.trim();
    const repo = await gh(repoPath);
    if (repo.permissions && repo.permissions.push === false) { const e = new Error('no push'); e.status = 403; throw e; }
    branch = repo.default_branch;
    await load();
    try { sessionStorage.setItem(TOKEN_KEY, token); if (remember) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    $('#login').hidden = true; $('#app').hidden = false; render();
  }
  const loginMessage = e => e.status === 401 ? '토큰이 올바르지 않거나 만료됐습니다.' : e.status === 403 || e.status === 404 ? '이 토큰으로는 홈페이지 저장소에 접근할 수 없습니다. 저장소 선택과 Contents: Read and write 권한을 확인해 주세요.' : '연결하지 못했습니다: ' + e.message;

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); const button = $('#login-form button[type=submit]'); button.disabled = true; $('#login-error').textContent = '';
    try { await connect($('#token').value, $('#remember').checked); } catch (err) { $('#login-error').textContent = loginMessage(err); }
    button.disabled = false;
  });
  $('#save').addEventListener('click', save);
  $('#logout').addEventListener('click', () => { if (dirty && !confirm('저장하지 않은 변경이 사라집니다. 로그아웃할까요?')) return; try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} dirty = false; location.reload(); });
  $('#preview').addEventListener('click', () => {
    try { sessionStorage.setItem('sig-preview', JSON.stringify({ data, assets: Object.fromEntries([...pending].map(([name, file]) => [name, file.url])) })); } catch (e) { toast('미리보기를 열지 못했습니다: ' + e.message, true); return; }
    window.open('/index.html?preview=1', '_blank');
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  (async () => {
    let saved = ''; try { saved = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    if (saved) { try { await connect(saved, !!localStorage.getItem(TOKEN_KEY)); return; } catch (e) { $('#login-error').textContent = loginMessage(e); } }
    $('#login').hidden = false;
  })();
})();
