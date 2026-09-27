// Fetch latest NDBC observations for the offshore buoys used by Surf Window and write buoys.json.
// Runs in a scheduled GitHub Action (NDBC does not allow browser requests from other sites).
import {writeFileSync} from 'node:fs';
const BUOYS={
  '44013':{name:'Boston',short:'Boston'},
  '44098':{name:'Jeffreys Ledge',short:'Jeffreys Ledge'},
  '44097':{name:'Block Island',short:'Block Island'}
};
const M_TO_FT=3.28084,MS_TO_MPH=2.23694;
async function text(url){const r=await fetch(url,{headers:{'User-Agent':'Surf Window (github.com/bg197550/surf-window)'}});if(!r.ok)throw Error(`${url}: ${r.status}`);return r.text()}
function rows(txt){const lines=txt.split('\n').filter(Boolean);const head=lines[0].replace(/^#/,'').trim().split(/\s+/);return lines.filter(l=>!l.startsWith('#')).map(l=>{const v=l.trim().split(/\s+/),o={};head.forEach((h,i)=>o[h]=v[i]);return o})}
const num=v=>v==null||v==='MM'||v===''?null:(Number.isFinite(+v)?+v:null);
const stamp=o=>`${o.YY}-${o.MM}-${o.DD}T${o.hh}:${o.mm}:00Z`;
const round=(v,d=1)=>v==null?null:Math.round(v*10**d)/10**d;
async function buoy(id){
  const out={id,...BUOYS[id]};
  const std=rows(await text(`https://www.ndbc.noaa.gov/data/realtime2/${id}.txt`));
  const wave=std.find(o=>num(o.WVHT)!=null);
  if(wave){out.time=stamp(wave);out.wvht_ft=round(num(wave.WVHT)*M_TO_FT);out.dpd=num(wave.DPD);if(out.dpd==null){const alt=std.find(o=>num(o.DPD)!=null&&Math.abs(Date.parse(stamp(o))-Date.parse(out.time))<=90*60000);out.dpd=alt?num(alt.DPD):null}out.apd=num(wave.APD);out.mwd=num(wave.MWD);out.wtmp_f=num(wave.WTMP)==null?null:round(num(wave.WTMP)*9/5+32,0)}
  const wind=std.find(o=>num(o.WSPD)!=null);
  if(wind){out.wspd_mph=round(num(wind.WSPD)*MS_TO_MPH,0);out.gst_mph=num(wind.GST)==null?null:round(num(wind.GST)*MS_TO_MPH,0);out.wdir=num(wind.WDIR);out.wind_time=stamp(wind)}
  try{const spec=rows(await text(`https://www.ndbc.noaa.gov/data/realtime2/${id}.spec`)).find(o=>num(o.SwH)!=null);
    if(spec){out.swh_ft=round(num(spec.SwH)*M_TO_FT);out.swp=num(spec.SwP);out.swd=spec.SwD&&spec.SwD!=='MM'?spec.SwD:null;out.wwh_ft=num(spec.WWH)==null?null:round(num(spec.WWH)*M_TO_FT);out.wwp=num(spec.WWP);out.wwd=spec.WWD&&spec.WWD!=='MM'?spec.WWD:null}}catch(e){console.error(id,'spec',e.message)}
  return out;
}
const results=await Promise.allSettled(Object.keys(BUOYS).map(buoy));
const buoys={},errors=[];
results.forEach((r,i)=>{const id=Object.keys(BUOYS)[i];if(r.status==='fulfilled')buoys[id]=r.value;else{errors.push(`${id}: ${r.reason?.message}`);console.error(id,r.reason)}});
if(!Object.keys(buoys).length){console.error('No buoy data');process.exit(1)}
const file=process.argv[2]||'buoys.json';
writeFileSync(file,JSON.stringify({generatedAt:new Date().toISOString(),source:'NOAA National Data Buoy Center',buoys,errors},null,2)+'\n');
console.log(`Wrote ${file}:`,Object.values(buoys).map(b=>`${b.id} ${b.wvht_ft} ft @ ${b.dpd} s`).join('; '));
