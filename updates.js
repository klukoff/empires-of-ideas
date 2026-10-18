'use strict';
(() => {
const D=window.ATLAS_DATA,R=D.rankings,U=D.updates;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=r=>r?.rank?r.rank.replace(/-/g,'–'):'Not published';
const year=(i,y)=>i.records.find(r=>r.year===y);
const shortNames={'harvard':'Harvard','berkeley':'UC Berkeley','duke':'Duke','humboldt':'Humboldt Berlin','free-berlin':'Free Berlin','tsinghua':'Tsinghua','nanjing':'Nanjing','hku':'Hong Kong','mit':'MIT','caltech':'Caltech'};
function movement(a,b){
 if(!a.rankMin||!b.rankMin)return 'No published rank in either edition';
 if(a.status==='exact'&&b.status==='exact'){
  const d=a.rankMin-b.rankMin;return d===0?'Unchanged':`${Math.abs(d)} places ${d>0?'higher':'lower'}`;
 }
 if(b.rankMax<a.rankMin)return 'Higher; baseline is a band';
 if(b.rankMin>a.rankMax)return 'Lower; baseline is a band';
 return 'Bands overlap; exact change unavailable';
}
function drawComparison(){
 const base=+$('comparison-baseline').value,peers=$('comparison-peers').checked;
 const order=['harvard','berkeley','duke','tsinghua','nanjing','hku','humboldt','free-berlin',...(peers?['mit','caltech']:[])];
 const institutions=order.map(id=>R.institutions.find(i=>i.id===id));
 const W=1070,H=institutions.length*43+68,L=182,E=260,T=44,plotRight=W-E;
 const x=v=>L+Math.log(v)/Math.log(200)*(plotRight-L);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="ARWU ranks, ${base} compared with 2026. Lower numerical ranks appear to the left. Published baseline bands remain ranges."><title>ARWU rank: ${base} and 2026</title><desc>Exact values and comparison descriptions appear in the table below. No position is inferred for the Berlin institutions.</desc><rect width="${W}" height="${H}" fill="#142029"/>`;
 s+=`<circle cx="7" cy="12" r="4" fill="#142029" stroke="#b8c2c8"/><text x="17" y="16" fill="#afbabf" font-size="10" font-family="Arial,sans-serif">${base}</text><circle cx="65" cy="12" r="3" fill="#d8b66f"/><text x="75" y="16" fill="#d8b66f" font-size="10" font-family="Arial,sans-serif">2026</text>`;
 for(const t of [1,5,10,25,50,100,200])s+=`<line x1="${x(t)}" y1="24" x2="${x(t)}" y2="${H-24}" stroke="#35434c" stroke-width=".6"/><text x="${x(t)}" y="15" text-anchor="middle" fill="#afbabf" font-size="10" font-family="Arial,sans-serif">${t}</text>`;
 institutions.forEach((i,j)=>{
  const a=year(i,base),b=year(i,2026),y=T+j*43+12;
  s+=`<text x="0" y="${y+4}" fill="#eee9dc" font-size="12" font-family="Arial,sans-serif">${esc(shortNames[i.id])}${i.profiled?'':' *'}</text>`;
  if(!a.rankMin||!b.rankMin){s+=`<text x="${L+10}" y="${y+4}" fill="#9dabb3" font-size="10" font-family="Arial,sans-serif">No published ARWU rank in either edition</text>`;return;}
  if(a.status==='exact'&&b.status==='exact')s+=`<line x1="${x(a.rankMin)}" y1="${y}" x2="${x(b.rankMin)}" y2="${y}" stroke="#acb5b9" stroke-width="1.5"/>`;
  if(a.status==='band')s+=`<line x1="${x(a.rankMin)}" y1="${y}" x2="${x(a.rankMax)}" y2="${y}" stroke="#a9b4bd" stroke-width="3"/><path d="M${x(a.rankMin)},${y-5}v10 M${x(a.rankMax)},${y-5}v10" stroke="#a9b4bd" fill="none"/>`;
  else s+=`<circle cx="${x(a.rankMin)}" cy="${y}" r="5" fill="#142029" stroke="#b8c2c8" stroke-width="1.5"/>`;
  s+=`<circle cx="${x(b.rankMin)}" cy="${y}" r="3.5" fill="#d8b66f"/><text x="${plotRight+22}" y="${y+4}" fill="#eee9dc" font-size="11" font-family="Arial,sans-serif">${label(a)} → ${label(b)}</text><text x="${plotRight+126}" y="${y+4}" fill="#afbabf" font-size="10" font-family="Arial,sans-serif">${esc(movement(a,b).replace('baseline is a band','band baseline'))}</text>`;
 });
 $('comparison-chart').innerHTML=s+'</svg>';
 $('baseline-column').textContent=base;
 $('change-table').querySelector('caption').textContent=`Published ARWU ranks, ${base} and 2026, with ordinal changes. A band is not assigned a midpoint.`;
 $('change-table').querySelector('tbody').innerHTML=institutions.map(i=>{const a=year(i,base),b=year(i,2026);return `<tr><th scope="row">${esc(i.name)}${i.profiled?'':' (comparison)'}</th><td>${label(a)}</td><td class="rank">${label(b)}</td><td class="muted">${esc(movement(a,b))}</td></tr>`;}).join('');
}
let filter='all';
function developments(){
 const items=U.developments.filter(d=>filter==='all'||d.groups.includes(filter));
 $('update-developments').innerHTML=items.map(d=>`<article class="update-development" id="update-${esc(d.id)}"><div class="update-date"><span class="mini-label">${esc(d.system)}</span><p>${esc(d.date)}</p><span class="update-status">${esc(d.kind)}</span></div><div class="update-facts"><h3>${esc(d.title)}</h3><p class="book-baseline"><strong>In the book:</strong> ${esc(d.baseline)}</p><p><strong>Later evidence:</strong> ${esc(d.facts)}</p><details><summary>Evidence limits and current status</summary><p>${esc(d.limit)}</p></details><div class="update-sources">${d.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.title)} ↗</a>`).join('')}</div></div><aside class="update-reading"><span class="mini-label">WHY IT MATTERS / INTERPRETATION</span><p>${esc(d.reading)}</p><p class="update-question">${esc(d.question)}</p></aside></article>`).join('');
}
document.querySelectorAll('[data-update-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.updateFilter;document.querySelectorAll('[data-update-filter]').forEach(x=>{const active=b===x;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active));});developments();}));
$('comparison-baseline').addEventListener('change',drawComparison);$('comparison-peers').addEventListener('change',drawComparison);
$('download-comparison').addEventListener('click',()=>{
 const svg=$('comparison-chart').querySelector('svg').cloneNode(true),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download=`empires-of-ideas-${$('comparison-baseline').value}-to-2026.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const downloads=document.querySelector('#sources .downloads');downloads.insertAdjacentHTML('beforeend','<a href="since-2022.txt" download>Since 2022 (.txt) ↓</a><a href="since-2022-sources.json" download>Update evidence (.json) ↓</a>');
drawComparison();developments();
})();
