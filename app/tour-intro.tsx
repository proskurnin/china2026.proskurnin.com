'use client';
import {useEffect,useState} from 'react';
import places from '@/data/tour-places.json';
import {PlacePhoto} from './tour-day-places';
export default function TourIntro({onProgram}:{onProgram:()=>void}){
 const [until,setUntil]=useState<number|null>(null);
 useEffect(()=>{const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());setUntil(Math.ceil((Date.parse('2026-10-26T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000));},[]);
 return <>
  <section className="tour-welcome"><div className="tour-welcome-copy"><p className="china-eyebrow">中国 · 26 ОКТЯБРЯ — 2 НОЯБРЯ 2026</p><h1>Наш маршрут<br/>по <em>Китаю.</em></h1><p className="tour-welcome-lead">Из Шереметьево — в чайные переулки Чэнду, к пандам и скалам Чжанцзяцзе. Роман и Артур отправляются за новыми историями вместе со школьным классом.</p><button className="primary" onClick={onProgram}>Листать нашу программу <span aria-hidden="true">↗</span></button><div className="tour-welcome-stats"><div><b>08</b><span>календарных дней</span></div><div><b>02</b><span>города в Китае</span></div><div><b>{until!==null&&until>0?until:'26.10'}</b><span>{until!==null&&until>0?'дней до вылета':'начало путешествия'}</span></div></div></div><div className="tour-eastern-photos" aria-label="Фотоальбом нашего маршрута">
 <article className="tour-hanging-scroll"><div className="tour-scroll-cap" aria-hidden="true"/><div className="tour-scroll-image"><PlacePhoto place={places.find(p=>p.id==='tianmen')!} hero priority/><span className="tour-vertical-inscription" lang="zh" aria-hidden="true">天门山</span></div><div className="tour-scroll-caption"><small>31 ОКТЯБРЯ · 张家界</small><h2>Небесные врата</h2><p>Тяньмэньшань · Чжанцзяцзе</p></div><div className="tour-scroll-cap" aria-hidden="true"/></article>
 <div className="tour-eastern-side"><article className="tour-moon-print"><div className="tour-moon-frame"><PlacePhoto place={places.find(p=>p.id==='alleys')!} hero/></div><div className="tour-print-caption"><small>26 ОКТЯБРЯ · 成都</small><h2>Переулки Чэнду</h2></div></article><article className="tour-water-print"><PlacePhoto place={places.find(p=>p.id==='lake')!} hero/><div className="tour-print-caption"><small>30 ОКТЯБРЯ · 宝峰湖</small><h2>Тишина Баофэна</h2></div></article><div className="tour-eastern-signature"><span aria-hidden="true" lang="zh">山水</span><p>Горы и вода<br/><small>Китай · осень 2026</small></p></div></div>
 </div></section>

 </>;
}
