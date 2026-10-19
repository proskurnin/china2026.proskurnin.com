'use client';
import {useEffect,useState} from 'react';
import {Plane} from 'lucide-react';
const departureAt=Date.parse('2026-10-26T21:55:00+03:00');
export default function TourCountdown(){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{
  const update=()=>setRemaining(Math.max(0,Math.ceil((departureAt-Date.now())/60000)));
  update();const timer=setInterval(update,1000);return()=>clearInterval(timer);
 },[]);
 const values=remaining===null?[null,null,null]:[Math.floor(remaining/1440),Math.floor(remaining%1440/60),remaining%60];
 return <section className="flight-countdown tour-flight-countdown" aria-label="Обратный отсчёт до вылета"><div className="flight-countdown-copy"><small><Plane size={16}/>{remaining===0?'ВРЕМЯ ВЫЛЕТА ПО РАСПИСАНИЮ НАСТУПИЛО':'ДО НАШЕГО ВЫЛЕТА'}</small><h2>Шереметьево → Чэнду</h2><p>26 октября 2026 · 21:55 МСК · терминал C</p><p>Sichuan Airlines · 3U 3888 · SVO → TFU (Тяньфу)</p></div><div className="countdown-digits">{values.map((value,index)=><div key={index}><b>{value===null?'—':String(value).padStart(2,'0')}</b><span>{['дней','часов','минут'][index]}</span></div>)}</div><div className="flight-status"><p>Отсчёт до 21:55 по Москве (UTC+3). Плановый прилёт: 27 октября, 11:00 по Чэнду (UTC+8). Статус рейса не обновляется автоматически.</p><a href="https://rasp.yandex.ru/plane/sheremetyevo-airport--chengdu" target="_blank" rel="noopener noreferrer">Расписание рейса ↗</a><a href="https://www.svo.aero/ru/timetable/departure" target="_blank" rel="noopener noreferrer">Табло Шереметьево ↗</a></div></section>;
}
