'use strict';

  // CLEAN PASS v29: stability + small UI tweaks

/* LevelUp Hybrid Skeleton — app.js
   HÍBRIDO:
   1) intenta cargar ./data/data.json (GitHub Pages) cuando hay internet
   2) si falla, usa la última copia en localStorage
   3) siempre puedes importar JSON manual (iPad offline) y se guarda localmente
*/
(function(){
  window.LEVELUP_BUILD = 'STABLE_RESET_v14';
  'use strict';

  // CLEAN PASS v29: stability + small UI tweaks

  const CONFIG = {
    remoteUrl: './data/data.json',
    remoteTimeoutMs: 3500,
    storageKey: 'levelup:data:v1'
  };

  // Weekly XP cap for "Actividades pequeñas" (per hero). If hero.weekXpMax is missing, we fall back to this.
  const DEFAULT_WEEK_XP_MAX = 40;

// Convierte texto a un nombre seguro de archivo (sin perder mayúsculas/minúsculas)
function sanitizeFileName(str){
  const raw = String(str || '').trim();
  if(!raw) return '';
  // quita acentos cuando sea posible
  let s = raw;
  try{ s = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(_e){}
  // quita caracteres inválidos para nombres de archivo / rutas
  s = s.replace(/[\\/\u0000-\u001f:*?"<>|]/g,'');
  // colapsa espacios
  s = s.replace(/\s+/g,' ').trim();
  return s;
}

function makeId(prefix='h'){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function makeBlankHero(group){
  return {
    id: makeId('h'),
    group: group || '2D',
    name: 'Nuevo héroe',
    age: '',
    role: '',
    level: 1,
    xp: 0,
    xpMax: 100,
    weekXp: 0,
    weekXpMax: DEFAULT_WEEK_XP_MAX,
    stats: { int: 0, sab: 0, car: 0, res: 0, cre: 0 },
    desc: '',
    goal: '',
    photo: '',
    // Para edición de encuadre (si más adelante activamos el editor)
    photoFit: { x: 50, y: 50, scale: 1 }
  };
}

  const state = {
    route: 'fichas',
    role: 'viewer',      // futuro: 'teacher' con PIN
    group: '2D',
    selectedHeroId: null,
    selectedChallengeId: null,
    isDetailsOpen: false,
    data: null,
    dataSource: '—'      // remote | local | demo
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));


function readFileAsDataURL(file){
  return new Promise((resolve, reject)=>{
    try{
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    } catch (err){
      reject(err);
    }
  });
}

  function demoData(){
    return {
      meta: { app: 'LevelUp', version: 'hybrid-skeleton-v1', updatedAt: new Date().toISOString() },
      heroes: [
        { id:'h1', group:'2D', name:'Eddy', age:12, role:'Analista', level:3, xp:28, xpMax:100,
          stats:{ INT:5, SAB:6, CAR:5, RES:7, CRE:8 }, weekXp:40, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' },
        { id:'h2', group:'2D', name:'Test', age:12, role:'Mentor', level:2, xp:25, xpMax:100,
          stats:{ INT:4, SAB:4, CAR:4, RES:4, CRE:4 }, weekXp:0, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' }
      ],
      challenges: [
        { id:'c1', title:'Desafío 1: Lectura breve', status:'locked', body:'(contenido teacher) ...' },
        { id:'c2', title:'Desafío 2: Escritura libre', status:'available', body:'(contenido teacher) ...' }
      ],
      events: [
        { id:'e1', title:'?????', locked:true, req:'Requisito: Completa 1 desafío' },
        { id:'e2', title:'Evento: Bonus XP', locked:false, req:'Siguiente: Completa 2 desafíos' }
      ]
    };
  }

  function normalizeData(data){
    const d = data && typeof data === 'object' ? data : {};
    d.meta = d.meta || {};
    d.meta.updatedAt = d.meta.updatedAt || new Date().toISOString();

    d.heroes = Array.isArray(d.heroes) ? d.heroes : [];
    d.challenges = Array.isArray(d.challenges) ? d.challenges : [];
    d.events = Array.isArray(d.events) ? d.events : [];

    d.heroes.forEach(h=>{
      h.id = h.id || uid('h');
      h.group = h.group || '2D';
      h.name = h.name ?? '';
      h.age = h.age ?? '';
      h.role = h.role ?? '';
      h.level = Number(h.level ?? 1);
      h.xp = Number(h.xp ?? 0);
      h.xpMax = Number(h.xpMax ?? 100);
      h.weekXp = Number(h.weekXp ?? 0);
      h.weekXpMax = Number(h.weekXpMax ?? DEFAULT_WEEK_XP_MAX);
      h.photoFit = h.photoFit || { x:50, y:50, scale:1 };
      // keep stats object
      h.stats = h.stats && typeof h.stats === 'object' ? h.stats : {};
      ['INT','SAB','CAR','RES','CRE'].forEach(k=>{ if (h.stats[k] === undefined) h.stats[k] = 0; });
    });
    return d;
  }



  // Router
  function setActiveRoute(route){
    state.route = route;
    $$('.page').forEach(p => p.classList.toggle('is-active', p.dataset.page === route));
    $$('.pill[data-route]').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    $$('#bottomNav .bottomNav__btn').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    const titleMap = { fichas:'FICHAS', desafios:'DESAFÍOS', eventos:'EVENTOS', personajes:'PERSONAJES', recompensas:'RECOMPENSAS' };
    const titleEl = $('#pageTitle');
    if (titleEl) titleEl.textContent = titleMap[route] || route.toUpperCase();
    const dbgRoute = $('#dbgRoute');
    if (dbgRoute) dbgRoute.textContent = route;
  }

  // Drawer
  function isDrawerLayout(){ return window.matchMedia('(max-width: 980px)').matches; }
  function closeDrawer(){ $('#shell').classList.remove('is-drawer-open'); $('#overlay').hidden = true; }
  function openDrawer(){ $('#shell').classList.add('is-drawer-open'); $('#overlay').hidden = false; }

  function isDetailsAvailable(){ return window.matchMedia('(min-width: 1181px)').matches; }
  function syncDetailsUI(){
    const shell = $('#shell');
    const btn = $('#btnDebugPanel');
    if (!shell || !btn) return;

    const canShow = isDetailsAvailable();
    if (!canShow){
      state.isDetailsOpen = false;
      shell.classList.remove('is-details-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed','false');
      btn.hidden = true;
      return;
    }

    btn.hidden = false;
    shell.classList.toggle('is-details-open', state.isDetailsOpen);
    btn.classList.toggle('is-active', state.isDetailsOpen);
    btn.setAttribute('aria-pressed', String(state.isDetailsOpen));
  }
  function toggleDetails(){
    if (!isDetailsAvailable()) return;
    state.isDetailsOpen = !state.isDetailsOpen;
    syncDetailsUI();
  }

  // Debug
  function updateDeviceDebug(){
    let d = 'desktop';
    if (window.matchMedia('(max-width: 640px)').matches) d = 'mobile';
    else if (window.matchMedia('(max-width: 1180px)').matches) d = 'tablet';
    $('#dbgDevice').textContent = d;
  }

  function updateDataDebug(){
    $('#dbgRole').textContent = state.role;
    $('#dbgDataSrc').textContent = state.dataSource;
    const upd = state.data?.meta?.updatedAt ? new Date(state.data.meta.updatedAt).toLocaleString() : '—';
    $('#dbgUpdated').textContent = upd;
    $('#brandSubtitle').textContent = (state.data?.meta?.app || 'LevelUp');
  }

  // Dropdown
  function toggleDatos(open){
    const dd = $('#btnDatos').closest('.dropdown');
    const isOpen = dd.classList.contains('is-open');
    const next = (typeof open === 'boolean') ? open : !isOpen;
    dd.classList.toggle('is-open', next);
    $('#btnDatos').setAttribute('aria-expanded', String(next));
  }
  function closeDatos(){ toggleDatos(false); }

  // Top "..." menu (mobile)
  function initTopMoreMenu(){
    const btn = $('#btnTopMore');
    const menu = $('#topMoreMenu');
    if (!btn || !menu) return;

    const close = () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded','false');
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = menu.hidden;
      menu.hidden = !next ? true : false;
      // If it was hidden, show; if shown, hide
      if (next){
        menu.hidden = false;
        btn.setAttribute('aria-expanded','true');
      } else {
        close();
      }
    });

    document.addEventListener('click', (e) => {
      if (menu.hidden) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    menu.addEventListener('click', () => setTimeout(close, 0));
  }

  // Textarea auto-grow (prevents inner scrollbars)
  function autoGrowTextarea(el){
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 80) + 'px';
  }
  function wireAutoGrow(root=document){
    $$('textarea', root).forEach(t => {
      if (t.dataset.autogrow === '1') return;
      t.dataset.autogrow = '1';
      autoGrowTextarea(t);
      t.addEventListener('input', () => autoGrowTextarea(t));
    });
  }

  // Toast
  let toastTimer = null;
  function toast(msg){
    let el = document.getElementById('toast');
    if (!el){
      el = document.createElement('div');
      el.id = 'toast';
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.bottom = 'calc(18px + env(safe-area-inset-bottom, 0px))';
      el.style.transform = 'translateX(-50%)';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '999px';
      el.style.background = 'rgba(10,10,10,0.92)';
      el.style.border = '1px solid rgba(255,215,120,0.20)';
      el.style.color = 'rgba(255,255,255,0.92)';
      el.style.boxShadow = '0 14px 40px rgba(0,0,0,0.55)';
      el.style.zIndex = '9999';
      el.style.fontSize = '13px';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ el.style.opacity = '0'; }, 2200);
  }

  // Storage
  function saveLocal(data){
    try{
      const payload = (data !== undefined) ? data : state.data;
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload));
      return true;
    }catch(e){
      return false;
    }
  }
  function loadLocal(){
    try{
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null; }
  }
  function clearLocal(){ try{ localStorage.removeItem(CONFIG.storageKey); }catch(e){} }

  // Remote fetch timeout
  async function fetchRemote(){
    const ctrl = new AbortController();
    const t = setTimeout(()=> ctrl.abort(), CONFIG.remoteTimeoutMs);
    try{
      const url = `${CONFIG.remoteUrl}?v=${Date.now()}`; // cache-buster
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  async function loadData({forceRemote=false} = {}){
    if (forceRemote){
      try{
        const d = await fetchRemote();
        state.data = normalizeData(d); state.dataSource = 'remote';
        saveLocal(state.data);
        toast('Cargado desde GitHub');
        updateDataDebug(); renderAll();
        return;
      }catch(e){
        toast('No se pudo cargar GitHub. Usando copia local.');
      }
    }else{
      try{
        const d = await fetchRemote();
        state.data = normalizeData(d); state.dataSource = 'remote';
        saveLocal(state.data);
        updateDataDebug(); renderAll();
        return;
      }catch(e){}
    }

    const local = loadLocal();
    if (local){
      state.data = normalizeData(local); state.dataSource = 'local';
      updateDataDebug(); renderAll();
      return;
    }

    state.data = normalizeData(demoData()); state.dataSource = 'demo';
    updateDataDebug(); renderAll();
  }

  // Render helpers
  function escapeHtml(s){
    return String(s ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function heroLabel(hero){
    const role = (hero.role && hero.role.trim()) ? hero.role.trim() : 'Sin rol';
    return `${role} · Nivel ${hero.level ?? 1}`;
  }

  function renderHeroList(){
    const list = $('#heroList');
    list.innerHTML = '';
    const heroes = (state.data?.heroes || []).filter(h => (h.group || '2D') === state.group);

    if (!heroes.length){
      list.innerHTML = '<div class="muted" style="padding:10px 6px;">No hay personajes.</div>';
      return;
    }
    if (!state.selectedHeroId || !heroes.some(h => h.id === state.selectedHeroId)){
      state.selectedHeroId = heroes[0].id;
    }

    heroes.forEach(hero => {
      const btn = document.createElement('button');
      btn.className = 'heroCard' + (hero.id === state.selectedHeroId ? ' is-active' : '');
      btn.dataset.heroId = hero.id;
      const xp = Number(hero.xp ?? 0);
      const xpMax = Number(hero.xpMax ?? 100);
      const pct = xpMax > 0 ? Math.max(0, Math.min(100, (xp / xpMax) * 100)) : 0;
      btn.innerHTML = `
        <div class="heroCard__row">
          <div>
            <div class="heroCard__name">${escapeHtml(hero.name || 'Nuevo héroe')}</div>
            <div class="heroCard__meta">${escapeHtml(heroLabel(hero))}</div>
          </div>
          <div class="heroCard__badge">XP ${xp}/${xpMax}</div>
        </div>
        <div class="heroCard__progress">
          <div class="heroCard__fill" style="width:${pct}%"></div>
        </div>
      `;
      btn.addEventListener('click', ()=>{
        state.selectedHeroId = hero.id;
        renderHeroList();
        renderHeroDetail();
        if (isDrawerLayout()) closeDrawer();
      });
      list.appendChild(btn);
    });
  }

  function currentHero(){
    const heroes = state.data?.heroes || [];
    return heroes.find(h => h.id === state.selectedHeroId) || heroes[0] || null;
  }

  function renderStats(hero){
    const box = $('#statsBox');
    const rawStats = hero?.stats || { INT:0, SAB:0, CAR:0, RES:0, CRE:0 };
    const stats = { ...rawStats };
    if (stats.RES == null && stats.CON != null) stats.RES = stats.CON;
    const order = ['INT','SAB','CAR','RES','CRE'];
    box.innerHTML = '';
    order.forEach((key)=>{
      const val = Number(stats[key] ?? 0);
      const pct = Math.max(0, Math.min(100, (val/20)*100));
      const wide = ''; // sin barra 'larga' para que el grid quede parejo
      const stat = document.createElement('div');
      stat.className = 'stat' + wide;
      stat.innerHTML = `
        <div class="badge">${key}</div>
        <div class="stat__track"><div class="stat__dot" style="left:${pct}%"></div></div>
        <div class="stat__val">${val}</div>
      `;
      box.appendChild(stat);
    });
  }

  function stripDiacritics(str){
    try{ return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }catch(_){ return String(str); }
  }

  function buildAssetCandidates(heroName){
    const base = String(heroName || '').trim();
    if (!base) return [];

    const raw = base;
    const noAcc = stripDiacritics(base);
    const lower = noAcc.toLowerCase();
    const slug = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const stems = [raw, noAcc, lower, slug].filter(Boolean);
    // GitHub Pages is case-sensitive; try common upper/lowercase extensions too.
    const exts = ['png','PNG','jpg','JPG','jpeg','JPEG','webp','WEBP'];
    const folders = ['assets/personajes', 'assets'];
    const out = [];
    for (const stem of stems){
      for (const ext of exts){
        for (const folder of folders){
          out.push(`${folder}/${stem}.${ext}`);
        }
      }
    }
    // de-duplicate while preserving order
    return Array.from(new Set(out));
  }

  function tryLoadAutoAvatar(heroName, heroObj, mountEl){
    const candidates = buildAssetCandidates(heroName);
    if (!candidates.length || !mountEl) return;

    let idx = 0;
    const probe = new Image();
    const tryNext = () => {
      if (idx >= candidates.length) return;
      const src = candidates[idx++];
      probe.onload = () => {
        // cache the resolved asset path on the hero so it persists in exports/backups
        if (heroObj && !heroObj.photoSrc && !heroObj.photo && !heroObj.img && !heroObj.image){
          heroObj.photoSrc = src;
          // ensure default fit exists
          heroObj.photoFit = heroObj.photoFit || { x:50, y:50, scale:1 };
          saveLocal(state.data);
          if (state.dataSource === 'remote') state.dataSource = 'local';
          updateDataDebug();
        }
        const img = document.createElement('img');
        img.src = src;
        img.alt = heroName;
        img.loading = 'lazy';
        mountEl.replaceChildren(img);
        // Apply fit if available
        applyPhotoFit(img, heroObj);
      };
      probe.onerror = () => tryNext();
      probe.src = src;
    };
    tryNext();
  }

  
  function applyPhotoFit(imgEl, heroObj){
    if (!imgEl) return;
    const fit = (heroObj && heroObj.photoFit) ? heroObj.photoFit : null;
    const x = fit && Number.isFinite(Number(fit.x)) ? Number(fit.x) : 50;
    const y = fit && Number.isFinite(Number(fit.y)) ? Number(fit.y) : 50;
    const scale = fit && Number.isFinite(Number(fit.scale)) ? Number(fit.scale) : 1;

    imgEl.style.objectFit = 'cover';
    imgEl.style.objectPosition = `${x}% ${y}%`;
    imgEl.style.transformOrigin = 'center';
    imgEl.style.transform = `scale(${scale})`;
  }

function renderHeroAvatar(hero){
    const box = $('#avatarBox');
    if (!box) return;

    const heroName = hero ? String(hero.name || hero.nombre || '').trim() : '';
    const url = hero ? (hero.photo || hero.img || hero.image || hero.photoSrc || '') : '';

    box.replaceChildren();

    if (url){
      const img = document.createElement('img');
      img.src = String(url);
      img.alt = heroName ? `Foto de ${heroName}` : 'Foto del héroe';
      img.loading = 'lazy';
      box.appendChild(img);
      applyPhotoFit(img, hero);
      return;
    }

    // No custom photo: show placeholder and try auto-load from assets/personajes/<Nombre>.(jpg|png|...)
    box.textContent = 'Sin foto';
    if (heroName) {
      tryLoadAutoAvatar(heroName, hero, box);
    }
  }

  const ROLE_OPTIONS = [
    { id:'analista', name:'Analista', desc:'Observa, detecta patrones y propone mejoras.' },
    { id:'mentor', name:'Mentor', desc:'Acompaña, explica y ayuda a otros a avanzar.' },
    { id:'creador', name:'Creador', desc:'Diseña ideas nuevas, soluciones y proyectos.' },
    { id:'guardian', name:'Guardián', desc:'Cuida el orden, el enfoque y las reglas del equipo.' },
    { id:'explorador', name:'Explorador', desc:'Prueba caminos nuevos y se adapta rápido a los retos.' }
  ];

  function renderRoleOptions(){
    const list = $('#roleList');
    if (!list) return;
    list.innerHTML = '';
    ROLE_OPTIONS.forEach(role=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'roleItem';
      btn.innerHTML = `
        <div class="roleItem__name">${escapeHtml(role.name)}</div>
        <div class="roleItem__desc">${escapeHtml(role.desc)}</div>
      `;
      btn.addEventListener('click', ()=>{
        const hero = currentHero();
        if (!hero) return;
        hero.role = role.name;
        $('#inRol').value = role.name;
        saveLocal(state.data);
        if (state.dataSource === 'remote') state.dataSource = 'local';
        updateDataDebug();
        renderHeroList();
        closeRoleModal();
        toast(`Rol: ${role.name}`);
      });
      list.appendChild(btn);
    });
  }

  function openRoleModal(){
    const modal = $('#roleModal');
    if (!modal) return;
    renderRoleOptions();
    modal.hidden = false;
  }
  function closeRoleModal(){
    const modal = $('#roleModal');
    if (!modal) return;
    modal.hidden = true;
  }

  function renderHeroDetail(){
    const hero = currentHero();
    if (!hero) return;

    // Avatar image (optional: add hero.img = "assets/.../file.png" in your JSON)
    renderHeroAvatar(hero);

    $('#heroName').textContent = (hero.name || 'NUEVO HÉROE').toUpperCase();
    $('#inNombre').value = hero.name || '';
    $('#inEdad').value = (hero.age ?? '');
    $('#inRol').value = hero.role || '';

    const tDesc = $('#txtDesc');
    const tMeta = $('#txtMeta');
    tDesc.value = hero.desc || '';
    tMeta.value = hero.goal || '';
    wireAutoGrow(document);
    autoGrowTextarea(tDesc);
    autoGrowTextarea(tMeta);
    const txtBien = $('#txtBien');
    if (txtBien) txtBien.value = hero.goodAt || '';
    const txtMejorar = $('#txtMejorar');
    if (txtMejorar) txtMejorar.value = hero.improve || '';

    renderStats(hero);

    const xp = Number(hero.xp ?? 0);
    const xpMax = Number(hero.xpMax ?? 100);
    const lvl = Number(hero.level ?? 1);
    $('#xpLevel').textContent = `Lvl ${lvl}`;
    $('#xpText').textContent = `· XP ${xp}/${xpMax}`;
    $('#xpFill').style.width = `${xpMax > 0 ? Math.max(0, Math.min(100, (xp/xpMax)*100)) : 0}%`;

    const w = Number(hero.weekXp ?? 0);
    const wMax = Number(hero.weekXpMax ?? DEFAULT_WEEK_XP_MAX);
    $('#weekXp').textContent = `${w}/${wMax} XP`;

    // Disable small-activity chips when weekly cap is reached
    const atMax = w >= wMax;
    $$('#actChips [data-xp]').forEach(b=>{ b.disabled = atMax; });

    renderRewards();
  }

  // --- Recompensas (placeholder) ---
  // En la versión estable aún no renderizamos recompensas aquí.
  // Se deja función vacía para evitar errores cuando el layout no incluye esa sección.
  function renderRewards(){
    // TODO: implementar cuando la sección de recompensas esté definida en el HTML + data.json
    return;
  }

  function renderChallenges(){
    const list = $('#challengeList');
    list.innerHTML = '';
    const challenges = state.data?.challenges || [];
    if (!challenges.length){
      list.innerHTML = '<div class="muted">Sin desafíos.</div>';
      return;
    }
    if (!state.selectedChallengeId) state.selectedChallengeId = challenges[0].id;

    challenges.forEach(ch=>{
      const item = document.createElement('div');
      item.className = 'challengeItem';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="challengeName">${escapeHtml(ch.title || 'Desafío')}</div>
        <div class="challengeMeta">Estado: ${escapeHtml(ch.status || '—')}</div>
      `;
      item.addEventListener('click', ()=>{
        state.selectedChallengeId = ch.id;
        renderChallengeDetail();
      });
      list.appendChild(item);
    });

    renderChallengeDetail();
  }

  // 🔥 AQUÍ está la regla: alumno no ve contenido
  function renderChallengeDetail(){
    const ch = (state.data?.challenges || []).find(x => x.id === state.selectedChallengeId);
    if (!ch){
      $('#challengeHint').textContent = 'Selecciona un desafío.';
      $('#challengeBody').textContent = '';
      return;
    }
    if (state.role === 'viewer'){
      $('#challengeHint').textContent = 'Modo alumno: solo nombre.';
      $('#challengeBody').textContent = 'Contenido oculto.';
    }else{
      $('#challengeHint').textContent = 'Modo edición: detalle visible.';
      $('#challengeBody').textContent = ch.body || '(sin contenido)';
    }
  }

  function renderEvents(){
    const grid = $('#eventGrid');
    grid.innerHTML = '';
    const evs = state.data?.events || [];
    if (!evs.length){
      grid.innerHTML = '<div class="muted">Sin eventos.</div>';
      return;
    }
    evs.forEach(ev=>{
      const div = document.createElement('div');
      div.className = 'tile' + (ev.locked ? ' locked' : '');
      div.innerHTML = `
        <div class="tile__img ${ev.locked ? '' : 'tile__img--unlocked'}"></div>
        <div class="tile__name">${escapeHtml(ev.title || 'Evento')}</div>
        <div class="tile__req">${escapeHtml(ev.req || '')}</div>
      `;
      grid.appendChild(div);
    });
  }

  function renderPeopleTable(){
    const box = $('#peopleTable');
    const heroes = state.data?.heroes || [];
    box.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'tr th';
    header.innerHTML = '<div>Nombre</div><div>Nivel</div><div>Rol</div><div>XP</div>';
    box.appendChild(header);

    heroes.forEach(h=>{
      const tr = document.createElement('div');
      tr.className = 'tr';
      tr.innerHTML = `
        <div>${escapeHtml(h.name || '—')}</div>
        <div>${escapeHtml(String(h.level ?? '—'))}</div>
        <div>${escapeHtml((h.role && h.role.trim()) ? h.role : '—')}</div>
        <div>${escapeHtml(String((h.xp ?? 0) + '/' + (h.xpMax ?? 100)))}</div>
      `;
      box.appendChild(tr);
    });
  }

  function renderAll(){
    renderHeroList();
    renderHeroDetail();
    renderChallenges();
    renderEvents();
    renderPeopleTable();
  }

  // “Edición” sin PIN aún (solo demo)
  function setRole(nextRole){
    state.role = nextRole;
    const btn = $('#btnEdicion');
    if (state.role === 'teacher'){
      btn.textContent = '🔓 Edición';
      btn.classList.remove('pill--danger');
      btn.classList.add('is-active');
      toast('Modo edición (demo)');
    }else{
      btn.textContent = '🔒 Edición';
      btn.classList.add('pill--danger');
      btn.classList.remove('is-active');
      toast('Modo vista (demo)');
    }
    updateDataDebug();
    renderChallengeDetail();
  }

  function bumpHeroXp(delta){
    const hero = currentHero();
    if (!hero) return;
    hero.xp = Math.max(0, Number(hero.xp ?? 0) + delta);
    saveLocal(state.data);
    if (state.dataSource === 'remote') state.dataSource = 'local'; // si tocaste algo local
    updateDataDebug();
    renderHeroList();
    renderHeroDetail();
  }

  // Import / Export (para tu flujo offline con iPad)
  async function handleImportJson(file){
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      data.meta = data.meta || {};
      data.meta.updatedAt = data.meta.updatedAt || new Date().toISOString();

      state.data = normalizeData(data);
      state.dataSource = 'local';
      saveLocal(state.data);

      updateDataDebug();
      renderAll();
      toast(`JSON importado: ${file.name}`);
    }catch(err){
      console.error(err);
      toast('Error al importar JSON');
    }
  }

  function handleExportJson(){
    const data = state.data || demoData();
    data.meta = data.meta || {};
    data.meta.updatedAt = new Date().toISOString();

    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n)=>String(n).padStart(2,'0');
    const fname = `LevelUp_backup_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Exportado JSON');
  }
  // Bind
  
  // --- Photo Fit Editor (encuadre + zoom) ---
  state.ui = state.ui || {};
  state.ui.photoEditOpen = false;

  function openPhotoModal(){
    const hero = currentHero();
    if (!hero) return;
    const modal = $('#photoModal');
    if (!modal) return;

    // Ensure fit defaults
    hero.photoFit = hero.photoFit || { x:50, y:50, scale:1 };

    // Ensure we have a source
    const src = hero.photo || hero.img || hero.image || hero.photoSrc || '';
    if (!src){
      // no image yet -> open picker
      const file = $('#fileHeroPhoto');
      file && (file.value='');
      file && file.click();
      return;
    }

    const previewBox = $('#photoPreviewBox');
    previewBox.replaceChildren();
    const img = document.createElement('img');
    img.id = 'photoPreviewImg';
    img.src = src;
    img.alt = 'Previsualización';
    img.loading = 'eager';
    previewBox.appendChild(img);
    applyPhotoFit(img, hero);

    const zoom = $('#photoZoom');
    zoom.value = String(hero.photoFit.scale ?? 1);

    // drag to pan
    let dragging = false;
    let startX = 0, startY = 0;
    let startFit = null;

    const onDown = (e)=>{
      dragging = true;
      previewBox.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      startFit = { x: hero.photoFit.x, y: hero.photoFit.y, scale: hero.photoFit.scale };
    };
    const onMove = (e)=>{
      if (!dragging) return;
      const rect = previewBox.getBoundingClientRect();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const nx = startFit.x - (dx / rect.width) * 100;
      const ny = startFit.y - (dy / rect.height) * 100;
      hero.photoFit.x = Math.max(0, Math.min(100, nx));
      hero.photoFit.y = Math.max(0, Math.min(100, ny));
      applyPhotoFit(img, hero);
      // update labels
      const lbl = $('#photoPosLabel');
      if (lbl) lbl.textContent = `${Math.round(hero.photoFit.x)}% · ${Math.round(hero.photoFit.y)}%`;
    };
    const onUp = ()=>{ dragging = false; };

    // bind listeners (overwrite previous)
    previewBox.onpointerdown = onDown;
    previewBox.onpointermove = onMove;
    previewBox.onpointerup = onUp;
    previewBox.onpointercancel = onUp;

    // zoom slider
    zoom.oninput = ()=>{
      hero.photoFit.scale = Number(zoom.value || 1);
      applyPhotoFit(img, hero);
      const zlbl = $('#photoZoomLabel');
      if (zlbl) zlbl.textContent = `${Math.round(hero.photoFit.scale*100)}%`;
    };

    // reset
    $('#btnPhotoReset')?.addEventListener('click', ()=>{
      hero.photoFit = { x:50, y:50, scale:1 };
      zoom.value = '1';
      applyPhotoFit(img, hero);
      const lbl = $('#photoPosLabel');
      if (lbl) lbl.textContent = `50% · 50%`;
      const zlbl = $('#photoZoomLabel');
      if (zlbl) zlbl.textContent = `100%`;
    }, { once:true });

    // change image (optional)
    $('#btnPhotoChange')?.addEventListener('click', ()=>{
      const file = $('#fileHeroPhoto');
      if (!file) return;
      file.value = '';
      file.click();
    }, { once:true });

    // save
    $('#btnPhotoSave')?.addEventListener('click', ()=>{
      saveLocal(state.data);
      if (state.dataSource === 'remote') state.dataSource = 'local';
      updateDataDebug();
      closePhotoModal();
      renderHeroDetail();
      renderHeroList();
      toast('Foto guardada.');
    }, { once:true });

    $('#btnPhotoCancel')?.addEventListener('click', ()=>{
      // Do not revert fit (simple). If you want revert, we'd need snapshot. Keep simple.
      closePhotoModal();
      renderHeroDetail();
    }, { once:true });

    modal.hidden = false;
    state.ui.photoEditOpen = true;

    // Update labels
    const lbl = $('#photoPosLabel');
    if (lbl) lbl.textContent = `${Math.round(hero.photoFit.x)}% · ${Math.round(hero.photoFit.y)}%`;
    const zlbl = $('#photoZoomLabel');
    if (zlbl) zlbl.textContent = `${Math.round((hero.photoFit.scale||1)*100)}%`;
  }

  function closePhotoModal(){
    const modal = $('#photoModal');
    if (!modal) return;
    modal.hidden = true;
    state.ui.photoEditOpen = false;
  }


  // --- Confirm modal (replaces browser confirm) ---
  function openConfirmModal({title='Confirmar', message='¿Seguro?', okText='Aceptar', cancelText='Cancelar'}){
    return new Promise((resolve)=>{
      const modal = $('#confirmModal');
      if (!modal){ resolve(window.confirm(message)); return; }
      $('#confirmTitle').textContent = title;
      $('#confirmMessage').textContent = message;
      const okBtn = $('#btnConfirmOk');
      const cancelBtn = $('#btnConfirmCancel');
      okBtn.textContent = okText;
      cancelBtn.textContent = cancelText;

      const cleanup = (val)=>{
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.hidden = true;
        resolve(val);
      };
      okBtn.onclick = ()=> cleanup(true);
      cancelBtn.onclick = ()=> cleanup(false);
      modal.hidden = false;
    });
  }

function bind(){
    // Cualquier botón "pill" con data-route (topnav + acciones derecha)
    $$('.pill[data-route]').forEach(btn => btn.addEventListener('click', () => setActiveRoute(btn.dataset.route)));
    $$('#bottomNav .bottomNav__btn').forEach(btn => btn.addEventListener('click', () => setActiveRoute(btn.dataset.route)));

    $('#btnMenu').addEventListener('click', ()=>{
      if (!isDrawerLayout()) return;
      const isOpen = $('#shell').classList.contains('is-drawer-open');
      isOpen ? closeDrawer() : openDrawer();
    });
    $('#overlay').addEventListener('click', closeDrawer);

    // Mobile: overflow menu for header actions (Recompensas/Estado/Datos/Edición)
    const btnTopMore = $('#btnTopMore');
    const topMoreMenu = $('#topMoreMenu');
    const closeTopMore = ()=>{
      if (!btnTopMore || !topMoreMenu) return;
      topMoreMenu.hidden = true;
      btnTopMore.setAttribute('aria-expanded','false');
    };
    const toggleTopMore = ()=>{
      if (!btnTopMore || !topMoreMenu) return;
      const willOpen = topMoreMenu.hidden;
      topMoreMenu.hidden = !willOpen;
      btnTopMore.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };
    if (btnTopMore && topMoreMenu){
      btnTopMore.addEventListener('click', (e)=>{ e.stopPropagation(); toggleTopMore(); });
      topMoreMenu.addEventListener('click', (e)=>{
        const item = e.target.closest('[data-proxy-click]');
        if (!item) return;
        const id = item.getAttribute('data-proxy-click');
        const target = id ? document.getElementById(id) : null;
        if (target) target.click();
        closeTopMore();
      });
      document.addEventListener('click', (e)=>{
        if (topMoreMenu.hidden) return;
        if (e.target === btnTopMore) return;
        if (topMoreMenu.contains(e.target)) return;
        closeTopMore();
      });
      window.addEventListener('resize', closeTopMore);
      window.addEventListener('orientationchange', ()=>{ closeTopMore(); closeDrawer(); });
    }

    $$('.segmented__btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        $$('.segmented__btn').forEach(x=>x.classList.remove('is-active'));
        b.classList.add('is-active');
        state.group = b.dataset.group || '2D';
        renderHeroList();
        renderHeroDetail();
      });
    });

    // Crear héroe nuevo (sin modal): se agrega a la lista del grupo actual y se abre la ficha
    const btnNuevoHeroe = $('#btnNuevoHeroe');
    if (btnNuevoHeroe){
      btnNuevoHeroe.addEventListener('click', ()=>{
        state.data = state.data || { heroes: [] };
        state.data.heroes = Array.isArray(state.data.heroes) ? state.data.heroes : [];
        const h = makeBlankHero(state.group || '2D');
        state.data.heroes.push(h);
        state.selectedHeroId = h.id;
        saveLocal();
        renderAll();
        requestAnimationFrame(()=>{
          const nameEl = document.getElementById('inNombre');
          if (nameEl) nameEl.focus();
          const card = document.querySelector(`[data-hero-id="${h.id}"]`);
          if (card){
            try{ card.scrollIntoView({block:'center', behavior:'smooth'}); }catch(_e){}
            card.classList.add('flash');
            setTimeout(()=>card.classList.remove('flash'), 650);
          }
        });
      });
    }

    // Datos dropdown
    $('#btnDatos').addEventListener('click', (e)=>{ e.stopPropagation(); toggleDatos(); });
    document.addEventListener('click', ()=> closeDatos());
    $('#menuDatos').addEventListener('click', (e)=> e.stopPropagation());

    $('#btnReloadRemote').addEventListener('click', async ()=>{
      closeDatos();
      await loadData({forceRemote:true});
    });

    $('#btnImportJson').addEventListener('click', ()=>{
      closeDatos();
      $('#fileJson').value = '';
      $('#fileJson').click();
    });
    $('#fileJson').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0];
      if (f) handleImportJson(f);
    });

    $('#btnExportJson').addEventListener('click', ()=>{
      closeDatos();
      handleExportJson();
    });

    $('#btnResetLocal').addEventListener('click', ()=>{
      closeDatos();
      clearLocal();
      toast('Copia local borrada');
      loadData({forceRemote:false});
    });

    // Role (sin PIN)
    $('#btnEdicion').addEventListener('click', ()=>{
      setRole(state.role === 'viewer' ? 'teacher' : 'viewer');
    });

    $('#btnDebugPanel').addEventListener('click', toggleDetails);

    $('#inRol').addEventListener('click', openRoleModal);
    $('#inRol').addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openRoleModal();
      }
    });
    $('#btnCloseRoleModal').addEventListener('click', closeRoleModal);
    $$('[data-close-role-modal]').forEach(el=> el.addEventListener('click', closeRoleModal));

    // Photo / Confirm modals backdrops
    $('#photoBackdrop')?.addEventListener('click', closePhotoModal);
    $('#confirmBackdrop')?.addEventListener('click', ()=>{ const b=$('#btnConfirmCancel'); if(b) b.click(); });

    // XP demo
    $('#btnXpM5').addEventListener('click', ()=> bumpHeroXp(-5));
    $('#btnXpM1').addEventListener('click', ()=> bumpHeroXp(-1));
    $('#btnXpP1').addEventListener('click', ()=> bumpHeroXp(+1));
    $('#btnXpP5').addEventListener('click', ()=> bumpHeroXp(+5));
    $$('.chipRow [data-xp]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const xp = Number(b.dataset.xp || 0);
        if (!xp) return;

        // Weekly-capped XP ("Actividades pequeñas")
        if (b.closest('#actChips')){
          const h = currentHero();
          if (!h) return;

          const max = Number(h.weekXpMax || DEFAULT_WEEK_XP_MAX || 40);
          h.weekXp = Number(h.weekXp || 0);
          const remaining = max - h.weekXp;
          if (remaining <= 0){
            toast('Ya llegaste al máximo de XP semanal...');
            renderHeroDetail(h);
            return;
          }
          const gain = Math.min(xp, remaining);
          h.weekXp += gain;
          bumpHeroXp(gain);
          return;
        }

        bumpHeroXp(xp);
      });
    });

    window.addEventListener('resize', ()=>{
      updateDeviceDebug();
      if (!isDrawerLayout()) closeDrawer();
      syncDetailsUI();
    });

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){
        closeDrawer();
        closeDatos();
        closeRoleModal();
        closePhotoModal();
        const cancel = $('#btnConfirmCancel');
        if (cancel) cancel.click();
      }
    });

    // UI helpers
    initTopMoreMenu();
    const resetBtn = $('#btnWeekReset');
    resetBtn?.addEventListener('click', async (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const h = currentHero();
      if (!h) return;
      const ok = await openConfirmModal({title:'Reiniciar XP semanal', message:'¿Reiniciar la XP semanal de este héroe?', okText:'Reiniciar', cancelText:'Cancelar'});
      if (!ok) return;
      h.weekXp = 0;
      if (!h.weekXpMax) h.weekXpMax = DEFAULT_WEEK_XP_MAX;
      saveLocal();
      if (state.dataSource === 'remote') state.dataSource = 'local';
      updateDataDebug();
      renderHeroDetail(h);
      toast('XP semanal reiniciada.');
    });

    // Eliminar héroe (icono de bote de basura en la tarjeta de foto)
    const btnEliminar = $('#btnEliminar') || $('#heroDeleteBtn');
    btnEliminar?.addEventListener('click', async (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const h = currentHero();
      if (!h) return;
      const ok = confirm(`¿Eliminar a "${h.name || 'este héroe'}"?\n\nEsto borra la ficha (se puede recuperar solo si tienes respaldo).`);
      if (!ok) return;
      // Remover del arreglo
      state.data.heroes = (state.data.heroes || []).filter(x => x.id !== h.id);
      // Seleccionar otro héroe si existe
      const next = (state.data.heroes || [])[0];
      state.selectedHeroId = next ? next.id : null;
      saveLocal(state.data);
      if (state.dataSource === 'remote') state.dataSource = 'local';
      updateDataDebug();
      renderAll();
      toast('Héroe eliminado.');
    });

    // Foto de héroe (subir/quitar)
    const photoInput = $('#fileHeroPhoto');
    const openPhotoPicker = () => {
      if (!photoInput) return;
      photoInput.value = '';
      photoInput.click();
    };

    $('#btnPonerFoto')?.addEventListener('click', (e)=>{
      e.preventDefault();
      openPhotoPicker();
    });
    $('#btnEditarFoto')?.addEventListener('click', (e)=>{
      e.preventDefault();
      openPhotoModal();
    });
    $('#btnQuitarFoto')?.addEventListener('click', (e)=>{
      e.preventDefault();
      const h = currentHero();
      if (!h) return;
      h.photo = '';
      h.img = '';
      h.image = '';
      saveLocal();
      renderHeroDetail(h);
      renderHeroList();
      toast('Foto eliminada.');
    });

    photoInput?.addEventListener('change', async ()=>{
      const h = currentHero();
      if (!h) return;
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      try{
        const dataUrl = await readFileAsDataURL(file);
        h.photo = dataUrl;
        h.photoSrc = '';
        h.photoFit = h.photoFit || { x:50, y:50, scale:1 };
        saveLocal(state.data);
        if (state.dataSource === 'remote') state.dataSource = 'local';
        updateDataDebug();
        renderHeroDetail(h);
        renderHeroList();
        // abre editor para encuadrar de inmediato
        openPhotoModal();
      }catch(err){
        console.error(err);
        toast('No se pudo cargar la foto.');
      }
    });

    wireAutoGrow(document);
  }

  async function init(){
    bind();
    setActiveRoute(state.route);
    updateDeviceDebug();
    syncDetailsUI();
    await loadData({forceRemote:false});
    setRole(state.role);
    syncDetailsUI();
  }

  init();
})();
