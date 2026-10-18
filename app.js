'use strict';
(() => {
const D = window.ATLAS_DATA, R = D.rankings;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profiled = R.institutions.filter(i => i.profiled);
let selected = new Set(profiled.map(i => i.id));
let scale = 'log';
const statusLabel = r => r?.rank ? r.rank.replace(/-/g,'–') : 'Not published';
const regionShort = r => r === 'United States' ? 'U.S.' : r;
const byYear = (i,y) => i.records.find(r => r.year===y);
let toastTimer;
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function showView(id, focus=false){
 if(!$(id)?.classList.contains('view')) id='rankings';
 document.querySelectorAll('.view').forEach(v=>{v.classList.toggle('active',v.id===id);v.hidden=v.id!==id;});
 document.querySelectorAll('.section-nav a').forEach(a=>{let active=a.hash==='#'+id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(focus) {$(id+'-title').focus({preventScroll:true});$('main').scrollIntoView({behavior:'instant',block:'start'});}
}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
 const id=a.hash.slice(1);if(!$(id)?.classList.contains('view')) return;e.preventDefault();history.replaceState(null,'','#'+id);showView(id,true);
}));
window.addEventListener('hashchange',()=>showView(location.hash.slice(1),true));
function legend(){
 $('institution-toggles').innerHTML=R.institutions.map(i=>`<label style="--series:${i.color}" class="${i.profiled?'':'comparator'}"><input type="checkbox" value="${i.id}" ${selected.has(i.id)?'checked':''}><span>${esc(i.name)}${i.profiled?'':' (comparison)'}</span></label>`).join('');
 $('institution-toggles').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{el.checked?selected.add(el.value):selected.delete(el.value);document.querySelectorAll('[data-group]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});drawMain();}));
}
document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{
 selected=new Set(profiled.filter(i=>b.dataset.group==='all'||i.group===b.dataset.group).map(i=>i.id));
 document.querySelectorAll('[data-group]').forEach(x=>{const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active));});legend();drawMain();
}));
$('scale').addEventListener('change',e=>{scale=e.target.value;drawMain();drawSmall();});
function chartSvg(institutions,mini=false){
 const W=mini?280:1100,H=mini?125:440,L=mini?24:54,T=mini?12:38,B=mini?20:36,E=mini?16:150;
 const right=W-E, bottom=H-B;
 const x=y=>L+(y-2003)/23*(right-L);
 const y=v=>T+(scale==='log'?Math.log(v)/Math.log(500):(v-1)/499)*(bottom-T);
 const ticks=mini?[1,100,500]:(scale==='log'?[1,5,10,25,50,100,250,500]:[1,100,200,300,400,500]);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${mini?esc(institutions[0].name):'Selected universities'}: published ARWU ranks from 2003 to 2026, ${scale} rank axis. Lower numerical rank appears higher."><title>ARWU global rank, 2003–2026</title><desc>Published ranges remain ranges. Gaps mean no rank published in retrieved records. See year table or download CSV for values.</desc><rect width="${W}" height="${H}" fill="#142029"/>`;
 s+=`<rect x="${x(2022.5)}" y="${T}" width="${right-x(2022.5)}" height="${bottom-T}" fill="#d8b66f" opacity=".045"/>`;
 ticks.forEach(v=>s+=`<line x1="${L}" y1="${y(v)}" x2="${right}" y2="${y(v)}" stroke="#35434c" stroke-width=".7"/><text x="${L-8}" y="${y(v)+3}" text-anchor="end" font-size="${mini?7:10}" fill="#afbabf">${v}</text>`);
 (mini?[2003,2026]:[2003,2005,2010,2015,2020,2022,2026]).forEach(v=>s+=`<text x="${x(v)}" y="${H-(mini?4:12)}" text-anchor="middle" font-size="${mini?8:10}" fill="#afbabf">${v}</text>`);
 if(!mini){s+=`<text x="${L}" y="17" font-size="10" fill="#afbabf">Higher rank ↑</text><text x="${x(2022.5)+7}" y="24" font-size="9" fill="#d8b66f">2023–26 follow-up</text>`;}
 const endLabels=[];
 for(const i of institutions){
  let segment=[];const segments=[];
  for(const r of i.records){if(r.status==='exact'){segment.push(r);}else{if(segment.length>1)segments.push(segment);segment=[];}}
  if(segment.length>1)segments.push(segment);
  for(const seg of segments)s+=`<path d="${seg.map((r,n)=>(n?'L':'M')+x(r.year)+','+y(r.rankMin)).join(' ')}" stroke="${i.color}" stroke-width="${mini?1.7:2}" fill="none" ${i.profiled?'':'stroke-dasharray="5 4"'}/>`;
  for(const r of i.records){
   if(!r.rankMin)continue;
   const lab=`${i.name} · ${r.year} · ${statusLabel(r)}${r.status==='band'?' (published rank band)':''}`;
   s+=`<g ${mini?'':`tabindex="0" role="img" aria-label="${esc(lab)}" data-readout="${esc(lab)}"`}><title>${esc(lab)}</title>`;
   if(r.status==='band')s+=`<line x1="${x(r.year)}" y1="${y(r.rankMin)}" x2="${x(r.year)}" y2="${y(r.rankMax)}" stroke="${i.color}" stroke-width="${mini?1.5:3}" opacity=".85"/><path d="M${x(r.year)-3},${y(r.rankMin)}h6 M${x(r.year)-3},${y(r.rankMax)}h6" stroke="${i.color}" stroke-width="1"/>`;
   else s+=`<circle cx="${x(r.year)}" cy="${y(r.rankMin)}" r="${mini?1.8:3}" fill="${i.color}"/>`;
   if(!mini)s+=`<rect x="${x(r.year)-5}" y="${y(r.rankMin)-5}" width="10" height="${Math.max(10,y(r.rankMax)-y(r.rankMin)+10)}" fill="transparent"/>`;
   s+='</g>';
  }
  if(!mini){const end=i.records.at(-1);if(end.rankMin)endLabels.push({i,r:end,y:y(end.rankMin)});}
 }
 if(!mini){
  endLabels.sort((a,b)=>a.y-b.y);let previous=-100;
  for(const l of endLabels){l.labelY=Math.max(l.y,previous+16);previous=l.labelY;}
  for(const l of endLabels){s+=`<path d="M${right+5},${l.y}L${right+15},${l.labelY}" stroke="${l.i.color}" stroke-width=".7"/><text x="${right+20}" y="${l.labelY+3}" fill="${l.i.color}" font-size="10">${esc(l.i.name)} ${statusLabel(l.r)}</text>`;}
 }
 s+='</svg>';return s;
}
function drawMain(){
 const visible=R.institutions.filter(i=>selected.has(i.id));
 if(!visible.length){$('rank-chart').innerHTML='<p class="empty-chart">Choose an institution above to show its ranking history.</p>';return;}
 $('rank-chart').innerHTML=chartSvg(visible)+'<p id="chart-readout" class="small muted chart-readout" role="status" aria-live="polite">Explore a mark for its institution, year, and published rank.</p>';
 $('rank-chart').querySelectorAll('[data-readout]').forEach(el=>{const read=()=>{$('chart-readout').textContent=el.dataset.readout;};el.addEventListener('mouseenter',read);el.addEventListener('focus',read);});
}
function drawSmall(){
 $('small-multiples').innerHTML=profiled.map(i=>{const latest=i.records.at(-1),first=i.records[0];return `<article class="mini-chart"><h4>${esc(i.name)} <span style="color:${i.color}">${statusLabel(latest)}</span></h4>${chartSvg([i],true)}<div class="mini-caption"><span>${statusLabel(first)} in 2003</span><span>${latest.rank?'2026 rank':'Not published 2005–26'}</span></div></article>`;}).join('');
}
function snapshot(){const y=+$('snapshot-year').value;$('year-output').value=y;$('year-output').textContent=y;
 const arr=[...R.institutions].sort((a,b)=>(byYear(a,y).rankMin??9999)-(byYear(b,y).rankMin??9999)||a.name.localeCompare(b.name));
 $('snapshot-table').querySelector('tbody').innerHTML=arr.map(i=>{const r=byYear(i,y);return `<tr><th scope="row"><span class="dot" style="background:${i.color};display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:8px"></span>${esc(i.name)}</th><td>${esc(regionShort(i.region))}</td><td class="rank">${statusLabel(r)}</td><td>${statusLabel(i.records[0])}</td><td class="muted">${i.profiled?'Profiled institution':'Comparison only'}</td></tr>`;}).join('');
 $('snapshot-table').querySelector('caption').textContent=`Published global ARWU ranks, ${y} edition, with 2003 comparison`;
}
$('snapshot-year').addEventListener('input',snapshot);
function sources(){
 $('ranking-sources').innerHTML=R.institutions.map(i=>`<article><span class="source-number">${i.profiled?'PROFILE':'COMPARISON'}</span><div><h4>${esc(i.officialName)}</h4><p>ARWU institution history, checked against annual ranking tables, 2003–2026. ${['humboldt','free-berlin'].includes(i.id)?'Published values in 2003–2004; no rank published in retrieved 2005–2026 tables.':''}</p><a href="${i.sourceUrl}" target="_blank" rel="noreferrer">Institution history ↗</a></div></article>`).join('')+`<article><span class="source-number">METHOD</span><div><h4>ARWU methodology, 2026</h4><p>The weight figure describes the 2026 edition. Earlier editions may use different definitions, sources, and time windows.</p><a href="${R.methodology.url}" target="_blank" rel="noreferrer">Ranking criteria and weights ↗</a></div></article><article><span class="source-number">BERLIN</span><div><h4>DFG / Wissenschaftsrat, June 2015</h4><p>Explains the ranking exclusion through competing claims to prewar Berlin University and the attribution of its Nobel Prizes. Printed page 37, footnote 9; PDF page 811.</p><a href="https://www.gwk-bonn.de/fileadmin/Redaktion/Dokumente/Papers/DFG-WR-Bericht-Juni2015.pdf#page=811" target="_blank" rel="noreferrer">Research-policy report ↗</a></div></article>`;
 $('data-check-status').textContent=`Data checked October 18, 2026: 240 institution-year records; 196 published ranks or bands and 44 Berlin gaps. All published ranks agreed between official institution histories and annual tables. Source retrieval method and record-level URLs are in the provenance download.`;
}
function profiles(){
 const order=['humboldt','free-berlin','harvard','berkeley','duke','tsinghua','nanjing','hku'];
 $('institution-profiles').innerHTML=order.map(id=>{const i=R.institutions.find(i=>i.id===id),p=i.profile;return `<article class="profile"><div class="profile-id"><span class="mini-label">${esc(i.region)} / CHAPTER ${p.chapter}</span><h3>${esc(i.name)}</h3><span class="source-ref">2026 ARWU: ${statusLabel(i.records.at(-1))}</span></div><div><h4>The case in the book</h4><p>${esc(p.role)}</p><span class="source-ref">Book: chapter ${p.chapter}. Historical case, not a current institutional assessment.</span></div><div><h4>The unresolved question</h4><p>${esc(p.tension)}</p><p class="profile-question">${esc(i.question)}</p></div></article>`;}).join('');
}
function weights(){
 $('methodology-weights').innerHTML=R.methodology.weights2026.map(w=>`<div class="weight"><span>${esc(w.label)}</span><span>${w.weight}%</span><div><i style="width:${w.weight*5}%"></i></div></div>`).join('');
 $('methodology-link').href=R.methodology.url;
}
function trust(){
 const W=440,H=195,L=34,T=25,B=25,E=24,x=v=>L+(v-2015)/11*(W-L-E),y=v=>T+(60-v)/60*(H-T-B);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="U.S. adults confident in higher education: 2015 57 percent, 2018 48, 2023 36, 2024 36, 2025 42, 2026 38. Selected survey years."><title>Public confidence, selected survey years</title>`;
 [0,20,40,60].forEach(v=>s+=`<line x1="${L}" y1="${y(v)}" x2="${W-E}" y2="${y(v)}" stroke="#35434c"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end" fill="#afbabf" font-size="9">${v}%</text>`);
 // Mark observations separately so missing survey years are never filled.
 D.trust.forEach(([yr,v])=>{s+=`<circle cx="${x(yr)}" cy="${y(v)}" r="4" fill="#d8b66f"><title>${yr}: ${v}%</title></circle><text x="${x(yr)}" y="${y(v)-12}" text-anchor="middle" fill="#eee9dc" font-size="10">${v}</text>`;});
 [2015,2018,2023,2026].forEach(yr=>s+=`<text x="${x(yr)}" y="${H-5}" text-anchor="middle" fill="#afbabf" font-size="9">${yr}</text>`);
 $('trust-chart').innerHTML=s+'</svg>';
}
function download(name,content,type){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('download-chart').addEventListener('click',()=>{const svg=$('rank-chart').querySelector('svg');if(!svg){toast('Choose an institution first.');return;}const copy=svg.cloneNode(true);copy.querySelectorAll('text').forEach(t=>t.setAttribute('font-family','Arial, sans-serif'));download('empires-of-ideas-arwu.svg',new XMLSerializer().serializeToString(copy),'image/svg+xml');});
legend();drawMain();drawSmall();snapshot();profiles();weights();trust();sources();showView(location.hash.slice(1));
})();
