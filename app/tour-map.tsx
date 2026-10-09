'use client';
import {useEffect,useState,lazy,Suspense} from 'react';
import places from '@/data/tour-places.json';
import tour from '@/data/public-tour.json';
import {routeForDay,transfers,tourDate,type TourDay} from '@/lib/tour-route';
const GoogleMap=lazy(()=>import('./tour-google-map'));
const OsmMap=lazy(()=>import('./tour-osm-map'));
const preference='china2026-tour-map-provider';
export default function TourMap({day,onDay}:{day:TourDay;onDay:(day:TourDay)=>void}){
 const [provider,setProvider]=useState<'google'|'osm'>('google');
 const [selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{try{if(localStorage.getItem(preference)==='osm')setProvider('osm');}catch{}},[]);
 useEffect(()=>setSelected(null),[day]);
 function chooseProvider(value:'google'|'osm'){setProvider(value);try{localStorage.setItem(preference,value);}catch{}}
 const {activePlaces,activeTransfers}=routeForDay(day),place=places.find(p=>p.id===selected);
 return <section className="china-map-section tour-atlas" aria-label="Карта мест и перемещений">
  <div className="china-map-heading"><div><p className="china-eyebrow">КАРТА ПУТЕШЕСТВИЯ · 中国</p><h2>{day==='all'?'Из Шереметьево — к горам Китая':day==='departure'?'26 октября · отправляемся в Китай':day==='return'?'2 ноября · возвращаемся домой':`${tourDate(day)} · день ${day} · ${tour.days.find(d=>d.day===day)?.city}`}</h2></div>{day!=='all'&&<button className="secondary" onClick={()=>onDay('all')}>Все дни</button>}</div>
  <div className="map-switch tour-map-switch" role="group" aria-label="Картографический сервис"><span>Шереметьево <i>→</i> Чэнду <i>⇄</i> Чжанцзяцзе <i>→</i> Шереметьево</span><button aria-pressed={provider==='google'} onClick={()=>chooseProvider('google')}>Google Maps</button><button aria-pressed={provider==='osm'} onClick={()=>chooseProvider('osm')}>OpenStreetMap</button></div>
  <div className="china-map-layout"><div><Suspense fallback={<div className="china-map-canvas tour-map-loading">Разворачиваем карту…</div>}>{provider==='google'?<GoogleMap day={day} selected={selected} onSelect={setSelected} onFallback={()=>chooseProvider('osm')}/>:<OsmMap day={day} selected={selected} onSelect={setSelected}/>}</Suspense><div className="china-map-key"><span>● Места · номер дня</span><span style={{color:'#b67d25'}}>↗ 26 октября · туда</span><span style={{color:'#ae4035'}}>↙ 2 ноября · обратно</span><span>↔ Поезда по Китаю</span></div><p className="china-map-note">Дуги и линии показывают направления, а не фактические трассы рейсов и поездов. В Чэнду пока отмечен город: аэропорт, вокзалы и места встреч уточняются.</p></div>
  </div>
  <div className="tour-atlas-stages" aria-label="Переезды по маршруту">{(activeTransfers.length?activeTransfers:transfers).map((t,i)=><button key={t.id} onClick={()=>onDay(t.day)}><span className="tour-stage-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><small>{t.label}</small><b>{t.title}</b><span>{t.note}</span></button>)}</div>
  <details className="tour-atlas-places" open><summary>Места на карте <span>{activePlaces.length}</span></summary><div className="china-map-places">{activePlaces.map(p=><button key={p.id} className={selected===p.id?'selected':''} aria-pressed={selected===p.id} onClick={()=>setSelected(p.id)}><span>{p.days[0]}</span>{p.title}</button>)}</div></details>
  {place&&<aside className="tour-atlas-detail" aria-label={place.title}><div><img src={place.image} alt={place.title}/><p className="tour-photo-credit"><a href={place.photoSource} target="_blank" rel="noreferrer">{place.author}</a> · <a href={place.licenseUrl} target="_blank" rel="noreferrer">{place.license}</a> · кадрирование</p></div><div><small>{place.days.map(tourDate).join(", ")} 2026 · {place.chinese}</small><h3>{place.title}</h3><p>{place.description}</p><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">Открыть на карте ↗</a></div><button className="tour-detail-close" aria-label="Закрыть описание места" onClick={()=>setSelected(null)}>×</button></aside>}
 </section>;
}
