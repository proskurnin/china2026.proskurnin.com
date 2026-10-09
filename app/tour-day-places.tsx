'use client';
import {useState} from 'react';
import places from '@/data/tour-places.json';
type Place=(typeof places)[number];
export function PlacePhoto({place,hero=false}:{place:Place;hero?:boolean}){
 const [failed,setFailed]=useState(false);
 return <figure className={hero?'tour-day-photo':'tour-place-photo'}>{failed?<div className="tour-photo-fallback">{place.title}</div>:<img src={place.image} alt={place.title} loading="lazy" onError={()=>setFailed(true)}/>}<figcaption><a href={place.photoSource} target="_blank" rel="noreferrer">{place.author}</a> · <a href={place.licenseUrl} target="_blank" rel="noreferrer">{place.license}</a> · кадрирование</figcaption></figure>;
}
export default function DayPlaces({day,onMap}:{day:number;onMap:()=>void}){
 const current=places.filter(p=>p.days.includes(day));
 if(!current.length)return <div className="tour-day-context"><PlacePhoto place={places[0]} hero/><p>Чэнду · городская атмосфера. Конкретные места прогулки {day===7?'и площадка Сычуаньской оперы':'в свободное время'} уточняются.</p></div>;
 return <div className="tour-place-grid">{current.map(p=><article className="tour-place-card" key={p.id}><PlacePhoto place={p}/><div className="tour-place-copy"><small>{p.chinese}</small><h3>{p.title}</h3><p>{p.description}</p><div className="tour-place-actions"><button onClick={onMap}>На карте ↗</button><a href={p.source} target="_blank" rel="noreferrer">О месте ↗</a></div></div></article>)}</div>;
}
