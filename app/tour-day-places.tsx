'use client';
import {useState} from 'react';
import {tourDate} from '@/lib/tour-route';
import places from '@/data/tour-places.json';
import guides from '@/data/place-guides.json';
import alerts from '@/data/place-alerts.json';
import type {PlaceGuide as Guide} from '@/lib/place-guide';
import PlaceGuide from './place-guide';
type Place=(typeof places)[number];
export function PlaceAlerts({placeId}:{placeId:string}){
 return alerts.filter(a=>a.placeId===placeId).map(alert=><aside className="place-guide-alert" key={alert.title} aria-label="Изменение работы достопримечательности"><strong>{alert.title}</strong><p>{alert.text}</p><small>Проверено {alert.checkedAt}</small><div className="place-guide-citations">{alert.sources.map(source=><a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div></aside>);
}
export function PlacePhoto({place,hero=false,priority=false}:{place:Place;hero?:boolean;priority?:boolean}){
 const [failed,setFailed]=useState(false);
 return <figure className={hero?'tour-day-photo':'tour-place-photo'}>{failed?<div className="tour-photo-fallback">{place.title}</div>:<img src={place.image} alt={place.title} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async" onError={()=>setFailed(true)}/>}<figcaption><a href={place.photoSource} target="_blank" rel="noreferrer">{place.author}</a> · <a href={place.licenseUrl} target="_blank" rel="noreferrer">{place.license}</a> · кадрирование</figcaption></figure>;
}
export default function DayPlaces({day,onMap}:{day:number;onMap:()=>void}){
 const current=places.filter(p=>p.days.includes(day));
 const extra=(guides as Guide[]).filter(g=>g.days?.includes(day)&&!places.some(p=>p.id===g.placeId));
 if(!current.length&&!extra.length)return <div className="tour-day-context"><PlacePhoto place={places[0]} hero/><p><b>{tourDate(day)} 2026</b> · Чэнду · городская атмосфера. Конкретные места прогулки {day===7?'и площадка Сычуаньской оперы':'в свободное время'} уточняются.</p></div>;
 return <div className="tour-place-grid">{current.map(p=><article className="tour-place-card" key={p.id}><PlacePhoto place={p}/><div className="tour-place-copy"><small>{tourDate(day)} 2026 · {p.chinese}</small><h3>{p.title}</h3><p>{p.description}</p><PlaceAlerts placeId={p.id}/><div className="tour-place-actions"><button onClick={onMap}>На карте ↗</button><a href={p.source} target="_blank" rel="noreferrer">О месте ↗</a></div>{(guides as Guide[]).filter(g=>g.placeId===p.id).map(g=><PlaceGuide key={g.placeId} guide={g}/>)}</div></article>)}{extra.map(g=><article className="tour-place-card" key={g.placeId}><div className="tour-place-copy"><small>День {day}</small><h3>{g.title}</h3><PlaceGuide guide={g}/></div></article>)}</div>;
}
