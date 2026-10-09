'use client';
import {useEffect,useState} from 'react';
import {Plane} from 'lucide-react';
const departureDate='2026-10-26';
export default function TourCountdown(){
 const [days,setDays]=useState<number|null>(null);
 useEffect(()=>{
  const update=()=>{const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());setDays(Math.round((Date.parse(departureDate+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000));};
  update();const timer=setInterval(update,60000);return()=>clearInterval(timer);
 },[]);
 if(days!==null&&days<0)return null;
 const noun=days!==null&&days%10===1&&days%100!==11?'день':days!==null&&days%10>=2&&days%10<=4&&(days%100<12||days%100>14)?'дня':'дней';
 return <section className="flight-countdown tour-flight-countdown" aria-label="Обратный отсчёт до вылета"><div className="flight-countdown-copy"><small><Plane size={16}/>ДО НАШЕГО ВЫЛЕТА</small><h2>Шереметьево → Чэнду</h2><p>26 октября 2026 · начало путешествия</p></div><div className="countdown-digits"><div><b>{days===null?'—':days===0?'Сегодня':days}</b><span>{days===0?'день вылета':noun}</span></div></div><div className="flight-status"><p>Отсчёт до даты вылета по московскому времени. Часы и минуты появятся после подтверждения времени рейса.</p></div></section>;
}
