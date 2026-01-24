(function(){
  'use strict';

  const state = {
    route: 'fichas',
    role: 'viewer', // futuro: 'teacher' con PIN
    subtab: 'ficha'
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setActiveRoute(route){
    state.route = route;

    $$('.page').forEach(p => p.classList.toggle('is-active', p.dataset.page === route));
    $$('.topnav .pill').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    $$('#bottomNav .bottomNav__btn').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));

    const titleMap = { fichas:'FICHAS', desafios:'DESAFÍOS', eventos:'EVENTOS', personajes:'PERSONAJES' };
    $('#pageTitle').textContent = titleMap[route] || route.toUpperCase();

    $('#dbgRoute').textContent = route;
  }

  function setActiveSubtab(subtab){
    state.subtab = subtab;
    $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.subtab === subtab));
  }

  function isDrawerLayout(){
    return window.matchMedia('(max-width: 980px)').matches;
  }

  function closeDrawer(){
    $('#shell').classList.remove('is-drawer-open');
    $('#overlay').hidden = true;
  }

  function openDrawer(){
    $('#shell').classList.add('is-drawer-open');
    $('#overlay').hidden = false;
  }

  function updateDeviceDebug(){
    let d = 'desktop';
    if (window.matchMedia('(max-width: 640px)').matches) d = 'mobile';
    else if (window.matchMedia('(max-width: 1180px)').matches) d = 'tablet';
    $('#dbgDevice').textContent = d;
  }

  // Dropdown "Datos"
  function toggleDatos(open){
    const dd = $('#btnDatos').closest('.dropdown');
    const isOpen = dd.classList.contains('is-open');
    const next = (typeof open === 'boolean') ? open : !isOpen;

    dd.classList.toggle('is-open', next);
    $('#btnDatos').setAttribute('aria-expanded', String(next));
  }
  function closeDatos(){ toggleDatos(false); }

  // Import JSON (offline-friendly)
  async function handleImportJson(file){
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      console.log('JSON importado:', data);
      toast(`JSON importado: ${file.name}`);
    }catch(err){
      console.error(err);
      toast('Error al importar JSON');
    }
  }

  function handleExportJson(){
    const demo = {
      meta:{ app:'LevelUp', version:'skeleton-v1' },
      state:{ route: state.route, role: state.role },
      note:'Export DEMO (todavía sin datos reales).'
    };
    const blob = new Blob([JSON.stringify(demo, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'levelup_export_demo.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Toast
  let toastTimer = null;
  function toast(msg){
    let el = $('#toast');
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

  // Sync sizes (evita traslapes cuando cambia la barra de Safari en iOS)
  function syncBarHeights(){
    const top = $('#topbar');
    const bottom = $('#bottomNav');
    const topH = top ? Math.round(top.getBoundingClientRect().height) : 76;
    const bottomH = (bottom && getComputedStyle(bottom).display !== 'none')
      ? Math.round(bottom.getBoundingClientRect().height)
      : 0;

    document.documentElement.style.setProperty('--topbar-h', `${topH}px`);
    document.documentElement.style.setProperty('--bottom-h', `${bottomH}px`);
  }

  function bind(){
    // Router
    $$('.topnav .pill').forEach(btn => btn.addEventListener('click', () => setActiveRoute(btn.dataset.route)));
    $$('#bottomNav .bottomNav__btn').forEach(btn => btn.addEventListener('click', () => setActiveRoute(btn.dataset.route)));

    // Tabs
    $$('.tab').forEach(t => t.addEventListener('click', ()=> setActiveSubtab(t.dataset.subtab)));

    // Drawer
    $('#btnMenu').addEventListener('click', ()=>{
      if (!isDrawerLayout()) return;
      const isOpen = $('#shell').classList.contains('is-drawer-open');
      isOpen ? closeDrawer() : openDrawer();
    });
    $('#overlay').addEventListener('click', closeDrawer);

    // Sidebar selection
    $$('#sidebar .heroCard').forEach(c => c.addEventListener('click', ()=>{
      $$('#sidebar .heroCard').forEach(x => x.classList.remove('is-active'));
      c.classList.add('is-active');
      if (isDrawerLayout()) closeDrawer();
    }));

    // Datos dropdown
    $('#btnDatos').addEventListener('click', (e)=>{
      e.stopPropagation();
      toggleDatos();
    });
    document.addEventListener('click', ()=> closeDatos());
    $('#menuDatos').addEventListener('click', (e)=> e.stopPropagation());

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

    $('#btnResetDemo').addEventListener('click', ()=>{
      closeDatos();
      toast('Demo reseteado (placeholder)');
    });

    // Placeholder buttons
    $('#btnPresentacion').addEventListener('click', ()=> toast('Presentación (placeholder)'));
    $('#btnTema').addEventListener('click', ()=> toast('Tema (placeholder)'));

    // Edición (SIN PIN por ahora): solo alterna role para probar UI
    $('#btnEdicion').addEventListener('click', ()=>{
      state.role = (state.role === 'viewer') ? 'teacher' : 'viewer';
      $('#dbgRole').textContent = state.role;

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
    });

    // Escape cierra drawer y dropdown
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){
        closeDrawer();
        closeDatos();
      }
    });

    // Resize
    window.addEventListener('resize', ()=>{
      syncBarHeights();
      updateDeviceDebug();
      if (!isDrawerLayout()) closeDrawer();
    });

    const ro = new ResizeObserver(()=> syncBarHeights());
    const top = $('#topbar'); if (top) ro.observe(top);
    const bottom = $('#bottomNav'); if (bottom) ro.observe(bottom);
  }

  function init(){
    bind();
    setActiveRoute(state.route);
    setActiveSubtab(state.subtab);
    syncBarHeights();
    updateDeviceDebug();
  }

  init();
})();
