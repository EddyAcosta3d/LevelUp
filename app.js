group: '2D',
selectedHeroId: null,
selectedChallengeId: null,
    isDetailsOpen: false,
data: null,
dataSource: '—'      // remote | local | demo
};
@@ -32,9 +33,9 @@
meta: { app: 'LevelUp', version: 'hybrid-skeleton-v1', updatedAt: new Date().toISOString() },
heroes: [
{ id:'h1', group:'2D', name:'Eddy', age:12, role:'Analista', level:3, xp:28, xpMax:100,
          stats:{ INT:5, SAB:6, CAR:5, CON:7, CRE:8 }, weekXp:40, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' },
          stats:{ INT:5, SAB:6, CAR:5, RES:7, CRE:8 }, weekXp:40, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' },
{ id:'h2', group:'2D', name:'Test', age:12, role:'Mentor', level:2, xp:25, xpMax:100,
          stats:{ INT:4, SAB:4, CAR:4, CON:4, CRE:4 }, weekXp:0, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' }
          stats:{ INT:4, SAB:4, CAR:4, RES:4, CRE:4 }, weekXp:0, weekXpMax:40, desc:'', goal:'', goodAt:'', improve:'' }
],
challenges: [
{ id:'c1', title:'Desafío 1: Lectura breve', status:'locked', body:'(contenido teacher) ...' },
@@ -68,6 +69,33 @@
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
@@ -213,10 +241,20 @@
heroes.forEach(hero => {
const btn = document.createElement('button');
btn.className = 'heroCard' + (hero.id === state.selectedHeroId ? ' is-active' : '');
      const xp = Number(hero.xp ?? 0);
      const xpMax = Number(hero.xpMax ?? 100);
      const pct = xpMax > 0 ? Math.max(0, Math.min(100, (xp / xpMax) * 100)) : 0;
btn.innerHTML = `
        <div class="heroCard__name">${escapeHtml(hero.name || 'Nuevo héroe')}</div>
        <div class="heroCard__meta">${escapeHtml(heroLabel(hero))}</div>
        <div class="heroCard__xp">XP ${(hero.xp ?? 0)}/${(hero.xpMax ?? 100)}</div>
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
@@ -235,31 +273,74 @@

function renderStats(hero){
const box = $('#statsBox');
    const stats = hero?.stats || { INT:0, SAB:0, CAR:0, CON:0, CRE:0 };
    const order = [
      ['INT','Inteligencia'],
      ['SAB','Lectura'],
      ['CAR','Carisma'],
      ['CON','Responsabilidad'],
      ['CRE','Creatividad']
    ];
    const rawStats = hero?.stats || { INT:0, SAB:0, CAR:0, RES:0, CRE:0 };
    const stats = { ...rawStats };
    if (stats.RES == null && stats.CON != null) stats.RES = stats.CON;
    const order = ['INT','SAB','CAR','RES','CRE'];
box.innerHTML = '';
    order.forEach(([key,label])=>{
    order.forEach((key)=>{
const val = Number(stats[key] ?? 0);
const pct = Math.max(0, Math.min(100, (val/20)*100));
const wide = (key === 'CRE') ? ' stat--wide' : '';
const stat = document.createElement('div');
stat.className = 'stat' + wide;
stat.innerHTML = `
       <div class="badge">${key}</div>
        <div class="stat__label">${label}</div>
       <div class="stat__track"><div class="stat__dot" style="left:${pct}%"></div></div>
       <div class="stat__val">${val}</div>
     `;
box.appendChild(stat);
});
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
@@ -509,6 +590,18 @@
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

// XP demo
$('#btnXpM5').addEventListener('click', ()=> bumpHeroXp(-5));
$('#btnXpM1').addEventListener('click', ()=> bumpHeroXp(-1));
@@ -521,12 +614,14 @@
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
}
});
}
@@ -536,8 +631,10 @@
setActiveRoute(state.route);
setActiveSubtab(state.subtab);
updateDeviceDebug();
    syncDetailsUI();
await loadData({forceRemote:false});
setRole(state.role);
    syncDetailsUI();
}

init();
