import type {Trip} from './trip';

export type WeatherTarget = {key:string; city:string; name:string; latitude:number; longitude:number; timezone:string; date:string};
export type WeatherReading = {code:number; min:number; max:number; rain:number|null; wind:number|null; date:string; retrievedAt:number};
export type WeatherResult = {target:WeatherTarget; reading?:WeatherReading; kind:'forecast'|'archive'|'reference'|'unavailable'; reason?:string};
const DAY=86400000, HOUR=3600000;
const variables='weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max';
export const weatherKey=(city:string,date:string)=>city+'@'+date;
export function dayWeatherTargets(plan:Trip,day:Trip['days'][number]):WeatherTarget[]{
 const ids=[day.city];
 for(const leg of plan.transfers){
  if((leg.departure?.slice(0,10)||leg.date)===day.date)ids.push(leg.from);
  if((leg.arrival?.slice(0,10)||leg.date)===day.date)ids.push(leg.to);
 }
 return [...new Set(ids)].flatMap(city=>{const c=plan.cities[city];return c&&Number.isFinite(c[1])&&Number.isFinite(c[2])?[{key:weatherKey(city,day.date),city,name:c[0],latitude:c[1],longitude:c[2],timezone:c[3]||'auto',date:day.date}]:[]});
}
export function localDate(now:number,timezone:string){try{return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}catch{return new Date(now).toISOString().slice(0,10)}}
export function historicalDate(date:string,today:string){
 const cutoff=new Date(Date.parse(today+'T12:00:00Z')-7*DAY).toISOString().slice(0,10);
 if(date<=cutoff)return date;
 let year=Number(date.slice(0,4))-1;
 let candidate='';
 do{const month=Number(date.slice(5,7)),day=Number(date.slice(8,10));const last=new Date(Date.UTC(year,month,0)).getUTCDate();candidate=`${year}-${date.slice(5,7)}-${String(Math.min(day,last)).padStart(2,'0')}`;year--}while(candidate>cutoff);
 return candidate;
}
export function readDaily(payload:any,date:string,retrievedAt:number):WeatherReading|undefined{
 const d=payload?.daily,i=d?.time?.indexOf(date);
 if(!Number.isInteger(i)||i<0)return;
 const code=d.weather_code?.[i],min=d.temperature_2m_min?.[i],max=d.temperature_2m_max?.[i];
 if(![code,min,max].every(Number.isFinite))return;
 return {code,min,max,rain:Number.isFinite(d.precipitation_sum?.[i])?d.precipitation_sum[i]:null,wind:Number.isFinite(d.wind_speed_10m_max?.[i])?d.wind_speed_10m_max[i]:null,date,retrievedAt};
}
export function chooseWeather(target:WeatherTarget,forecast:any,history:any,now:number,forecastAt=now,historyAt=now):WeatherResult{
 const today=localDate(now,target.timezone);
 const fresh=now-forecastAt<HOUR&&forecastAt<=now;
 const live=fresh?readDaily(forecast,target.date,forecastAt):undefined;
 if(live)return {target,reading:live,kind:target.date<today?'archive':'forecast'};
 const sample=historicalDate(target.date,today),reading=readDaily(history,sample,historyAt);
 return {target,reading,kind:reading?(sample===target.date?'archive':'reference'):'unavailable',reason:target.date>today?'Прогноз на эту дату пока недоступен.':'Свежие данные на эту дату недоступны.'};
}

type Cached={at:number;data:any};
const memory=new Map<string,Cached>(),pending=new Map<string,Promise<Cached>>();
let active=0;const queue:Array<()=>void>=[];
async function request(url:string,ttl:number):Promise<Cached>{
 let cached=memory.get(url);
 if(!cached&&typeof localStorage!=='undefined')try{cached=JSON.parse(localStorage.getItem('china-weather-v1:'+url)||'null')}catch{}
 if(cached&&Date.now()-cached.at<ttl&&cached.at<=Date.now()){memory.set(url,cached);return cached}
 const running=pending.get(url);if(running)return running;
 const task=(async()=>{
  await new Promise<void>(resolve=>{const start=()=>{active++;resolve()};if(active<3)start();else queue.push(start)});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Weather unavailable');const data:any=await response.json();if(data.error)throw Error('Weather unavailable');const result={at:Date.now(),data};memory.set(url,result);try{localStorage.setItem('china-weather-v1:'+url,JSON.stringify(result))}catch{}return result}
  finally{clearTimeout(timer);active--;queue.shift()?.()}
 })();pending.set(url,task);try{return await task}finally{pending.delete(url)}
}
export async function loadCityWeather(targets:WeatherTarget[],now=Date.now()):Promise<WeatherResult[]>{
 const first=targets[0];if(!first)return [];
 const common={latitude:String(first.latitude),longitude:String(first.longitude),timezone:first.timezone,daily:variables};
 const today=localDate(now,first.timezone);
 const candidates=targets.filter(t=>{const delta=(Date.parse(t.date)-Date.parse(today))/DAY;return delta>=-7&&delta<=15});
 let forecast:Cached|undefined;
 if(candidates.length)try{forecast=await request('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({...common,forecast_days:'16',past_days:'7'}),HOUR)}catch{}
 const missing=targets.filter(t=>!forecast||!readDaily(forecast.data,t.date,forecast.at));
 const dates=[...new Set(missing.map(t=>historicalDate(t.date,today)))].sort();
 // Fetch separate years/ranges, so imported itineraries never trigger huge archive requests.
 const archives=new Map<string,Cached>();
 const groups=new Map<string,string[]>();for(const date of dates){const month=date.slice(0,7);groups.set(month,[...(groups.get(month)||[]),date])}
 await Promise.all([...groups.values()].map(async dates=>{try{const archive=await request('https://archive-api.open-meteo.com/v1/archive?'+new URLSearchParams({...common,start_date:dates[0],end_date:dates[dates.length-1]}),DAY);for(const date of dates)archives.set(date,archive)}catch{}}));
 return targets.map(target=>{const a=archives.get(historicalDate(target.date,today));return chooseWeather(target,forecast?.data,a?.data,Date.now(),forecast?.at??0,a?.at??0)});
}
