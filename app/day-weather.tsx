'use client';
import {useEffect,useMemo,useState,useCallback} from 'react';
import {Sun,CloudSun,Cloud,CloudFog,CloudDrizzle,CloudRain,CloudSnow,CloudLightning,Droplets,Wind,RefreshCw,CloudOff,CalendarClock} from 'lucide-react';
import type {Trip} from '@/lib/trip';
import {dayWeatherTargets,loadCityWeather,type WeatherResult} from '@/lib/weather';

export function weatherCondition(code:number){
 if(code===0)return {Icon:Sun,label:'Ясно',tone:'sun'};
 if(code===1||code===2)return {Icon:CloudSun,label:'Переменная облачность',tone:'sun'};
 if(code===3)return {Icon:Cloud,label:'Пасмурно',tone:'cloud'};
 if(code===45||code===48)return {Icon:CloudFog,label:'Туман',tone:'cloud'};
 if([51,53,55,56,57].includes(code))return {Icon:CloudDrizzle,label:'Морось',tone:'rain'};
 if([61,63,65,66,67,80,81,82].includes(code))return {Icon:CloudRain,label:'Дождь',tone:'rain'};
 if([71,73,75,77,85,86].includes(code))return {Icon:CloudSnow,label:'Снег',tone:'snow'};
 if([95,96,99].includes(code))return {Icon:CloudLightning,label:'Гроза',tone:'rain'};
 return {Icon:Cloud,label:'Переменная погода',tone:'cloud'};
}
export function useTripWeather(plan:Trip){
 const targets=useMemo(()=>plan.days.flatMap(d=>dayWeatherTargets(plan,d)),[plan]);
 const signature=JSON.stringify(targets);
 const [results,setResults]=useState<Record<string,WeatherResult>>({}),[refresh,setRefresh]=useState(0),[updating,setUpdating]=useState(false);
 const retry=useCallback(()=>setRefresh(n=>n+1),[]);
 useEffect(()=>{const interval=setInterval(retry,3600000);const visible=()=>{if(document.visibilityState==='visible')retry()};document.addEventListener('visibilitychange',visible);window.addEventListener('online',retry);return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',retry)}},[retry]);
 useEffect(()=>{let cancelled=false;setUpdating(true);setResults({});const groups=new Map<string,typeof targets>();for(const t of targets){const key=[t.city,t.latitude,t.longitude,t.timezone].join('|');groups.set(key,[...(groups.get(key)||[]),t])}Promise.all([...groups.values()].map(async group=>{const rows=await loadCityWeather(group);if(!cancelled)setResults(previous=>({...previous,...Object.fromEntries(rows.map(r=>[r.target.key,r]))}))})).finally(()=>{if(!cancelled)setUpdating(false)});return()=>{cancelled=true}},[signature,refresh]);
 return {results,updating,retry};
}
const fullDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const temp=(n:number)=>(Math.round(n)>0?'+':'')+Math.round(n)+'°';
export function MiniDayWeather({plan,day,weather}:{plan:Trip;day:Trip['days'][number];weather:ReturnType<typeof useTripWeather>}){
 const target=dayWeatherTargets(plan,day).find(t=>t.city===day.city);
 const result=target?weather.results[target.key]:undefined;
 const reading=result?.reading;
 const condition=reading?weatherCondition(reading.code):undefined;
 const Icon=condition?.Icon||CloudOff;
 const historical=result?.kind==='reference'||result?.kind==='archive';
 const label=reading&&condition
  ? `${target?.name}: ${condition.label}, максимум ${temp(reading.max)}, минимум ${temp(reading.min)}. ${historical?`Архив за ${fullDate(reading.date)}${result?.kind==='reference'?' — ориентир, не прогноз':''}`:'Прогноз на '+fullDate(day.date)}`
  : `${target?.name||day.title}: ${!result?'погода загружается':'погода временно недоступна'}`;
 return <span className="day-strip-weather" role="img" aria-label={label} title={label}>
  <Icon size={12} aria-hidden="true"/>
  <span aria-hidden="true">{reading?`${historical?'≈':''}${Math.round(reading.max)}°`:!result?'…':'—'}</span>
 </span>;
}
export default function DayWeather({plan,day,weather}:{plan:Trip;day:Trip['days'][number];weather:ReturnType<typeof useTripWeather>}){
 const targets=dayWeatherTargets(plan,day);
 return <section className="day-weather" aria-label={'Погода на '+fullDate(day.date)}><div className="weather-heading"><h3><CloudSun size={18}/>Погода на {fullDate(day.date)}</h3><button type="button" className="weather-refresh" onClick={weather.retry} disabled={weather.updating} aria-label="Обновить погоду" title="Обновить погоду"><RefreshCw size={15}/></button></div><div className="weather-cities">{targets.map(t=>{const result=weather.results[t.key],r=result?.reading;const condition=r?weatherCondition(r.code):null;const Icon=condition?.Icon||CloudOff;return <article className={'weather-card '+(condition?.tone||'cloud')} key={t.key}><div className="weather-city"><strong>{t.name}</strong><span className={'weather-badge '+(result?.kind==='forecast'?'live':'history')}>{!result?'Загружаем…':result.kind==='forecast'?'Онлайн-прогноз':r?'Историческая погода':'Нет данных'}</span></div>{r&&condition?<><div className="weather-main"><Icon size={36} aria-hidden="true"/><div><b>{temp(r.max)}</b><span>макс. / {temp(r.min)} мин.</span></div><p>{condition.label}</p></div><div className="weather-metrics"><span><Droplets size={15}/>{r.rain===null?'Осадки: нет данных':r.rain.toLocaleString('ru-RU',{maximumFractionDigits:1})+' мм осадков'}</span><span><Wind size={15}/>{r.wind===null?'Ветер: нет данных':'до '+Math.round(r.wind)+' км/ч'}</span></div>{result?.kind==='reference'?<p className="weather-explanation"><CalendarClock size={14}/><span>{result.reason} Данные за {fullDate(r.date)} — ориентир, не прогноз.</span></p>:result?.kind==='archive'?<p className="weather-explanation">Архив за {fullDate(r.date)}.</p>:<p className="weather-explanation">{t.date===new Intl.DateTimeFormat('en-CA',{timeZone:t.timezone==='auto'?undefined:t.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())?'Прогноз на сегодня.':'Прогноз может измениться.'} Обновление каждый час.</p>}<small className="weather-updated">Получено {new Date(r.retrievedAt).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></>:<p className="weather-empty"><Icon size={24}/>{!result?'Получаем погоду для этого дня…':'Погода временно недоступна: не удалось получить прогноз и архив. Попробуйте обновить.'}</p>}</article>})}</div><a className="weather-source" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Погодные данные: Open-Meteo · исторические данные — метеореанализ</a></section>
}
