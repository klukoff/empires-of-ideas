'use strict';
(() => {
const D=window.ATLAS_DATA.endowments;
if(!D)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=r=>r?.value==null?'Comparable total not verified':`${r.currency==='USD'?'US$':r.currency==='HKD'?'HK$':r.currency==='EUR'?'€':'CNY '}${(r.value/(r.value>=1e9?1e9:1e6)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} ${r.value>=1e9?'billion':'million'}`;
const date=s=>s?new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}):'Date unavailable';
const visible=()=>D.institutions.filter(i=>i.profiled||$('endowment-peers').checked);
function draw(){
 const rows=visible().filter(i=>i.category==='endowment');
 const W=1120,L=172,R=915,T=48,step=99,plotBottom=T+rows.length*step-12,H=plotBottom+116;
 const max=Math.ceil(Math.max(...rows.flatMap(i=>[i.latest.value,i.baseline?.value||0]))/1e10)*10;
 const x=v=>L+v/max*(R-L),b=r=>(r.value/1e9).toFixed(2);
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="fund-chart-title fund-chart-desc"><title id="fund-chart-title">Reported U.S. university endowments, FY2021 and latest available</title><desc id="fund-chart-desc">Nominal U.S. dollars in billions, linear axis from zero. Latest dates differ by institution. Exact values, scope notes and sources appear below and in the CSV download.</desc><rect width="${W}" height="${H}" fill="#142029"/>`;
 for(let v=0;v<=max;v+=10)svg+=`<line x1="${x(v)}" y1="${T-13}" x2="${x(v)}" y2="${plotBottom}" stroke="#35434c" stroke-width=".7"/><text x="${x(v)}" y="${plotBottom+20}" text-anchor="middle" fill="#afbabf" font-size="10">${v}</text>`;
 svg+=`<text x="${L}" y="19" fill="#afbabf" font-size="10">US$ billions</text><rect x="${L+133}" y="10" width="18" height="9" fill="none" stroke="#afbabf"/><text x="${L+159}" y="19" fill="#afbabf" font-size="10">FY2021</text><rect x="${L+240}" y="10" width="18" height="9" fill="#d8b66f"/><text x="${L+266}" y="19" fill="#d8b66f" font-size="10">Latest reported</text>`;
 rows.forEach((i,n)=>{
  const y=T+n*step,latest=i.latest,baseline=i.baseline;
  svg+=`<text x="${L-16}" y="${y+20}" text-anchor="end" fill="#eee9dc" font-size="14">${esc(i.name)}${i.profiled?'':'*'}</text>`;
  if(baseline)svg+=`<rect x="${L}" y="${y}" width="${x(baseline.value/1e9)-L}" height="12" fill="#142029" stroke="#afbabf"/><text x="${x(baseline.value/1e9)+8}" y="${y+10}" fill="#afbabf" font-size="11">${b(baseline)}</text>`;
  svg+=`<rect x="${L}" y="${y+21}" width="${x(latest.value/1e9)-L}" height="14" fill="#d8b66f"/><text x="${x(latest.value/1e9)+8}" y="${y+33}" fill="#d8b66f" font-size="12">${b(latest)}</text><text x="${L}" y="${y+55}" fill="#afbabf" font-size="10">${esc(baseline?`FY2021 → FY${latest.fiscalYear}`:`FY${latest.fiscalYear}`)} · latest ${esc(date(latest.date))}</text>`;
 });
 svg+=`<text x="16" y="${plotBottom+53}" fill="#afbabf" font-size="10">Reported balances; fiscal dates differ. Nominal USD, no inflation adjustment. * Optional comparison institution.</text><text x="16" y="${plotBottom+71}" fill="#afbabf" font-size="10">Berkeley adds Blue &amp; Gold Pool from FY2024; Harvard FY2026 deducts US$1.425bn deferred tax. Pledge and trust treatment differs.</text><a href="https://klukoff.github.io/empires-of-ideas/#endowments"><text x="16" y="${plotBottom+89}" fill="#d8b66f" font-size="10">Institutional reports, exact values and scope: klukoff.github.io/empires-of-ideas/#endowments · checked October 18, 2026</text></a></svg>`;$('endowment-chart').innerHTML=svg;
 $('endowment-records').innerHTML=visible().map(i=>`<article class="endowment-record"><div><span class="mini-label">${esc(i.system)}</span><h4>${esc(i.name)}${i.profiled?'':'*'}</h4><span class="fund-category">${esc(i.categoryLabel)}</span></div><div><p class="endowment-value">${esc(money(i.latest))}</p><p class="fund-measure">${esc(i.latest.label)}</p><p class="fund-date">${esc(i.latest.dateLabel||date(i.latest.date))}${i.latest.date&&i.latest.fiscalYear?` · FY${i.latest.fiscalYear}`:''}</p>${i.baseline?`<p class="fund-baseline">FY2021: ${esc(money(i.baseline))}<br>${esc(date(i.baseline.date))}</p>`:''}</div><div><p class="fund-scope">${esc(i.scope)}</p>${i.caution?`<p class="fund-warning">${esc(i.caution)}</p>`:''}${i.details?.length?`<details><summary>Composition & historical basis</summary>${i.details.map(s=>`<p>${esc(s)}</p>`).join('')}</details>`:''}<div class="fund-sources">${i.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.label||s.title)} ↗${s.location?` <span>(${esc(s.location)})</span>`:''}</a>`).join('')}</div></div></article>`).join('');
 $('endowment-reading').innerHTML=D.reading.map(r=>`<div><h4>${esc(r.title)}</h4><p>${esc(r.text)}</p></div>`).join('');
}
$('endowment-peers').addEventListener('change',draw);
$('download-endowment-chart').addEventListener('click',()=>{const svg=$('endowment-chart').querySelector('svg');const a=document.createElement('a');const url=URL.createObjectURL(new Blob([svg.outerHTML],{type:'image/svg+xml'}));a.href=url;a.download='empires-of-ideas-endowments.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
draw();
})();
