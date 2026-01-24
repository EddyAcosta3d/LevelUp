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
@@ -151,6 +153,9 @@
const xpMax = Number(hero.xpMax ?? 100);
const pct = xpMax > 0 ? Math.max(0, Math.min(100, (xp / xpMax) * 100)) : 0;
btn.innerHTML = `
        <div class="heroCard__name">${escapeHtml(hero.name || 'Nuevo héroe')}</div>
        <div class="heroCard__meta">${escapeHtml(heroLabel(hero))}</div>
        <div class="heroCard__xp">XP ${(hero.xp ?? 0)}/${(hero.xpMax ?? 100)}</div>
       <div class="heroCard__row">
         <div>
           <div class="heroCard__name">${escapeHtml(hero.name || 'Nuevo héroe')}</div>
@@ -179,11 +184,20 @@

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
@@ -301,12 +315,6 @@
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
