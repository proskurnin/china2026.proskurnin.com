import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function initialState(html){
 const marker=/window\.INITIAL_STATE\s*=\s*/g.exec(html);
 if(!marker)throw Error('Нет структурированного расписания; страница: '+(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'без заголовка').slice(0,120));
 const start=marker.index+marker[0].length;
 let depth=0,quoted=false,escape=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(html.slice(start,i+1));}
 throw Error('Неполные данные расписания');
}
function timestamp(value,offset){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))return null;
 const result=/(Z|[+-]\d{2}:\d{2})$/.test(value)?value:value+offset;
 return Number.isFinite(Date.parse(result))?result:null;
}
export function parseFlight(html,trip,now=new Date().toISOString()){
 const state=initialState(html);
 const segments=state?.search?.segments;
 if(!Array.isArray(segments))throw Error('Формат источника изменился');
 const match=segments.filter(s=>String(s.number).replace(/\s/g,'')===trip.number.replace(/\s/g,'')&&s.startDate===trip.departure.slice(0,10));
 if(match.length!==1)throw Error('Рейс на нужную дату не найден однозначно');
 const s=match[0],offset=trip.departure.slice(-6),arrivalOffset=trip.arrival.slice(-6);
 const scheduled=timestamp(s.departureLocalDt,offset);
 if(!scheduled||scheduled.slice(0,10)!==trip.departure.slice(0,10))throw Error('Дата расписания не совпадает');
 const event=s.departureEvent||{},arrivalEvent=s.arrivalEvent||{};
 const departure=timestamp(event.dateTime||event.time,offset)||scheduled;
 if(Math.abs(Date.parse(departure)-Date.parse(scheduled))>3*86400000)throw Error('Слишком большой сдвиг времени');
 const depStatus=String(event.status||'').toLowerCase(),arrStatus=String(arrivalEvent.status||'').toLowerCase();
 const status=/cancel|отмен/.test(depStatus)?'cancelled':/arrived|landed|прибыл|приземлил/.test(arrStatus)?'arrived':/departed|вылетел|отправился/.test(depStatus)?'departed':/delay|задерж/.test(depStatus)?'delayed':'scheduled';
 return {number:trip.number,date:trip.departure.slice(0,10),departure,scheduledDeparture:scheduled,arrival:timestamp(arrivalEvent.dateTime||arrivalEvent.time,arrivalOffset)||timestamp(s.arrivalLocalDt,arrivalOffset)||trip.arrival,status,checkedAt:now,source:'Яндекс Расписания',sourceUrl:trip.sourceUrl};
}
export async function run(){
 const trips=JSON.parse(await readFile('lib/transports.json','utf8'));
 let previous={flights:{}};
 try{const r=await fetch('https://china2026.proskurnin.com/transport-status.json',{signal:AbortSignal.timeout(10000)});if(r.ok)previous=await r.json();}catch{}
 const result={checkedAt:new Date().toISOString(),flights:previous.flights||{},errors:{}};
 const verified=JSON.parse(await readFile('public/transport-verified.json','utf8'));
 for(const [id,item] of Object.entries(verified.flights||{})){if(!result.flights[id]||Date.parse(item.checkedAt)>Date.parse(result.flights[id].checkedAt))result.flights[id]=item;}
 for(const trip of trips.filter(t=>t.mode==='flight')){
  // Retain the last result after the flight's observation window.
  if(Date.now()>Date.parse(trip.arrival)+86400000)continue;
  try{const response=await fetch(trip.sourceUrl,{headers:{'User-Agent':'China2026 travel schedule monitor/1.0','Accept-Language':'ru-RU'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('HTTP '+response.status);result.flights[trip.id]=parseFlight(await response.text(),trip);console.log(trip.number+': '+result.flights[trip.id].departure+' / '+result.flights[trip.id].status);}
  catch(error){result.errors[trip.id]='Не удалось проверить расписание: '+error.message;console.log(trip.number+': '+result.errors[trip.id]);}
 }
 await writeFile('transport-status.json',JSON.stringify(result,null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
