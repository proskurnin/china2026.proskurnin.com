'use client';
import {useEffect,useState} from 'react';
import {CloudOff} from 'lucide-react';
import {weatherCondition} from './day-weather';
import {loadCityWeather,weatherKey,type WeatherTarget,type WeatherResult} from '@/lib/weather';
import type {TourDay} from '@/lib/tour-route';
const cities={svo:{name:'Шереметьево',latitude:55.9726,longitude:37.4146,timezone:'Europe/Moscow'},chengdu:{name:'Чэнду',latitude:30.66,longitude:104.06,timezone:'Asia/Shanghai'},zhangjiajie:{name:'Чжанцзяцзе',latitude:29.12,longitude:110.48,timezone:'Asia/Shanghai'}};
const stops:Array<Array<keyof typeof cities>>=[['svo','chengdu'],['chengdu'],['chengdu','zhangjiajie'],['zhangjiajie'],['zhangjiajie'],['zhangjiajie'],['zhangjiajie','chengdu'],['chengdu','svo']];
export const calendarDays=stops.map((stops,i)=>({day:i+1,date:new Date(Date.UTC(2026,9,26+i)).toISOString().slice(0,10),stops}));
const targets:WeatherTarget[]=calendarDays.flatMap(d=>d.stops.map(city=>({key:weatherKey(city,d.date),city,date:d.date,...cities[city]})));
const temperature=(value:number)=>(value>0?'+':'')+Math.round(value)+'°';
export default function TourCalendar({selectedDay,onDay}:{selectedDay:TourDay;onDay:(day:TourDay)=>void}){
 const [results,setResults]=useState<Record<string,WeatherResult>>({});
 useEffect(()=>{
  let cancelled=false;
  const refresh=()=>{
   for(const city of Object.keys(cities)){
    void loadCityWeather(targets.filter(t=>t.city===city)).then(rows=>{
     if(!cancelled)setResults(old=>({...old,...Object.fromEntries(rows.map(r=>[r.target.key,r]))}));
    });
   }
  };
  refresh();
  const timer=setInterval(refresh,3600000);
  window.addEventListener('online',refresh);
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('online',refresh)};
 },[]);
 return <section className="tour-calendar-section" id="tour-calendar"><nav className="day-strip china-date-strip" aria-label="Даты путешествия"><button type="button" className={selectedDay==='all'?'current':''} aria-pressed={selectedDay==='all'} onClick={()=>onDay('all')}><small>ВСЯ ПОЕЗДКА</small><b>Весь маршрут</b><span className="tour-calendar-city">26 окт. — 2 нояб.</span></button>{calendarDays.map(d=>{
  const selected=selectedDay===d.day||(d.day===1&&selectedDay==='departure')||(d.day===8&&selectedDay==='return');
  const city=d.day===1?'svo':d.day===8?'chengdu':d.stops[0];
  const result=results[weatherKey(city,d.date)],reading=result?.reading;
  const condition=reading?weatherCondition(reading.code):undefined,Icon=condition?.Icon||CloudOff;
  const historical=result?.kind==='reference';
  const details=d.stops.map(c=>{const r=results[weatherKey(c,d.date)],v=r?.reading;return v?`${cities[c].name}: ${weatherCondition(v.code).label}, ${temperature(v.min)}…${temperature(v.max)}. ${r.kind==='reference'?'Архив за '+v.date+' — не прогноз':'На '+d.date}`:`${cities[c].name}: погода пока недоступна`;}).join('\n');
  return <button type="button" key={d.date} className={selected?'current':''} aria-pressed={selected} onClick={()=>onDay(d.day)} title={details}>
   <small>{new Date(d.date+'T12:00:00Z').toLocaleDateString('ru-RU',{weekday:'short',timeZone:'UTC'})}</small>
   <span className="date-weather" role="img" aria-label={details}><span className="date-weather-city"><span className="date-weather-reading"><Icon size={12} aria-hidden="true"/><strong>{reading?temperature(reading.max):result?'—':'…'}</strong></span><span className="date-weather-kind">{historical?'архив':result?.kind==='forecast'?'прогноз':''}</span></span></span>
   <b>{new Date(d.date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'})}</b>
   <span className="tour-calendar-city">{d.stops.map(c=>cities[c].name).join(' → ')}</span>
  </button>;
 })}</nav><p className="tour-calendar-note">Погода: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. «Архив» — данные прошлого года, не прогноз. Подробности — при наведении на дату. Города по дням пока распределены предварительно.</p></section>;
}
