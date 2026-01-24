/* LevelUp Hybrid Skeleton — app.js
   HÍBRIDO:
   1) intenta cargar ./data/data.json (GitHub Pages) cuando hay internet
   2) si falla, usa la última copia en localStorage
   3) siempre puedes importar JSON manual (iPad offline) y se guarda localmente
*/
(function(){
  'use strict';

  const CONFIG = {
    remoteUrl: './data/data.json',
    remoteTimeoutMs: 3500,
    storageKey: 'levelup:data:v1'
  };

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

  // Router
  function setActiveRoute(route){
    state.route = route;
    $$('.page').forEach(p => p.classList.toggle('is-active', p.dataset.page === route));
    $$('.topnav .pill').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    $$('#bottomNav .bottomNav__btn').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    const titleMap = { fichas:'FICHAS', desafios:'DESAFÍOS', eventos:'EVENTOS', personajes:'PERSONAJES' };
    $('#pageTitle').textContent = titleMap[route] || route.toUpperCase();
    $('#dbgRoute').textContent = route;
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
    try{ localStorage.setItem(CONFIG.storageKey, JSON.stringify(data)); return true; }
    catch(e){ return false; }
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
        state.data = d; state.dataSource = 'remote';
        saveLocal(d);
        toast('Cargado desde GitHub');
        updateDataDebug(); renderAll();
        return;
      }catch(e){
        toast('No se pudo cargar GitHub. Usando copia local.');
      }
    }else{
      try{
        const d = await fetchRemote();
        state.data = d; state.dataSource = 'remote';
        saveLocal(d);
        updateDataDebug(); renderAll();
        return;
      }catch(e){}
    }

    const local = loadLocal();
    if (local){
      state.data = local; state.dataSource = 'local';
      updateDataDebug(); renderAll();
      return;
    }

    state.data = demoData(); state.dataSource = 'demo';
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
  // 5 stats arranged in a 2-column grid (desktop/tablet) that fills vertically.
  // Mobile breakpoints switch this to 1 column via CSS.
  const list = [
    ["INT","inteligencia"],
    ["CAR","carisma"],
    ["CRE","creatividad"],
    ["SAB","lectura"],
    ["RES","responsabilidad"],
  ];
  const wrap = $("#statsWrap");
  wrap.innerHTML = list.map(([key, prop])=>{
    const v = clampNum(hero[prop] ?? 0, 0, 10);
    return `
      <div class="stat">
        <span class="badge">${key}</span>
        <div class="stat__track"><div class="stat__fill" style="width:${v*10}%"></div></div>
        <span class="stat__val">${v}</span>
      </div>`;
  }).join("");
})();