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
 return <section className="tour-calendar-section" id="tour-calendar"><div className="tour-calendar-heading"><span>26 октября — 2 ноября 2026</span><button type="button" onClick={()=>onDay('all')} aria-pressed={selectedDay==='all'}>Весь маршрут</button></div><nav className="day-strip china-date-strip" aria-label="Даты путешествия">{calendarDays.map(d=>{const selected=selectedDay===d.day||(d.day===1&&selectedDay==='departure')||(d.day===8&&selectedDay==='return');return <button type="button" key={d.date} className={selected?'current':''} aria-pressed={selected} onClick={()=>onDay(d.day)}><b>{new Date(d.date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'})}</b><small>{new Date(d.date+'T12:00:00Z').toLocaleDateString('ru-RU',{weekday:'short',timeZone:'UTC'})} · день {d.day}</small><span className="tour-calendar-city">{d.stops.map(c=>cities[c].name).join(' → ')}</span><span className="tour-calendar-weather">{d.stops.map(city=>{const r=results[weatherKey(city,d.date)],reading=r?.reading,condition=reading?weatherCondition(reading.code):undefined,Icon=condition?.Icon||CloudOff;const historical=r?.kind==='reference';const title=reading?`${cities[city].name}: ${condition?.label}, ${temperature(reading.min)}…${temperature(reading.max)}. ${historical?'Архив за '+reading.date+' — не прогноз':'На '+d.date}`:`${cities[city].name}: прогноз пока недоступен`;return <span className="tour-calendar-weather-city" key={city} title={title}><span>{cities[city].name}</span><span><Icon size={16} aria-hidden="true"/>{reading?`${temperature(reading.min)} / ${temperature(reading.max)}`:r?'Нет прогноза':'Загрузка…'}</span><small>{historical?'Архив '+reading?.date.slice(0,4)+' · не прогноз':r?.kind==='forecast'?'Прогноз':r?.kind==='archive'?'Архив':'Прогноз ожидается'}</small></span>})}</span></button>})}</nav><p className="tour-calendar-note">Города распределены предварительно по восьмидневной программе; уточним после получения билетов. Если прогноз ещё недоступен, показана погода на ту же дату прошлого года с пометкой «Архив» — это не прогноз. <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Данные Open-Meteo</a> · обновление каждый час.</p></section>
}
