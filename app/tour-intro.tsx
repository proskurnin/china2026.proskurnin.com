'use client';
import {useEffect,useState} from 'react';
import places from '@/data/tour-places.json';
import {PlacePhoto} from './tour-day-places';
export default function TourIntro({onProgram}:{onProgram:()=>void}){
 const [until,setUntil]=useState<number|null>(null);
 useEffect(()=>{const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());setUntil(Math.ceil((Date.parse('2026-10-26T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000));},[]);
 return <>
  <section className="tour-welcome"><div className="tour-welcome-copy"><p className="china-eyebrow">中国 · 26 ОКТЯБРЯ — 2 НОЯБРЯ 2026</p><h1>Китай.<br/>Между небом<br/>и <em>землёй.</em></h1><p className="tour-welcome-lead">Из Шереметьево — в чайные переулки Чэнду, к пандам и скалам Чжанцзяцзе. Роман и Артур отправляются за новыми историями вместе со школьным классом.</p><button className="primary" onClick={onProgram}>Листать нашу программу <span aria-hidden="true">↗</span></button><div className="tour-welcome-stats"><div><b>08</b><span>календарных дней</span></div><div><b>02</b><span>города в Китае</span></div><div><b>{until!==null&&until>0?until:'26.10'}</b><span>{until!==null&&until>0?'дней до вылета':'начало путешествия'}</span></div></div></div><div className="tour-welcome-photos"><div className="tour-welcome-main"><PlacePhoto place={places.find(p=>p.id==='tianmen')!} hero/><div className="tour-photo-title"><small>张家界 · ЧЖАНЦЗЯЦЗЕ</small><strong>Навстречу<br/>Небесным вратам</strong></div></div><div className="tour-welcome-inset"><PlacePhoto place={places.find(p=>p.id==='alleys')!} hero/><span>成都 · УЛИЦЫ ЧЭНДУ</span></div><span className="tour-photo-seal" aria-hidden="true">山<br/>水</span></div></section>

 </>;
}
