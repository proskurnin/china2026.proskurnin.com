'use client';
import {useEffect,useRef,useState} from 'react';
import places from '@/data/tour-places.json';
import tour from '@/data/tour.json';
import 'leaflet/dist/leaflet.css';

type Day = number|'all'|'departure';
export default function TourMap({day,onDay}:{day:Day;onDay:(day:Day)=>void}){
 const node=useRef<HTMLDivElement>(null);
 const map=useRef<import('leaflet').Map|null>(null);
 const layers=useRef<import('leaflet').LayerGroup|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const active=places.filter(p=>day==='all'||typeof day==='number'&&p.days.includes(day));
 const place=places.find(p=>p.id===selected);
 useEffect(()=>{
  let live=true;let observer:ResizeObserver|undefined;
  import('leaflet').then(({default:L})=>{
   if(!live||!node.current)return;
   const m=L.map(node.current,{scrollWheelZoom:false}).setView([30,107],6);map.current=m;
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m).on('tileerror',()=>setError('Подложка карты временно недоступна. Список мест и ссылки на навигацию доступны ниже.'));
   layers.current=L.layerGroup().addTo(m);
   observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(node.current);setReady(true);
  }).catch(()=>setError('Не удалось загрузить карту. Используйте ссылки на места ниже.'));
  return()=>{live=false;observer?.disconnect();map.current?.remove();map.current=null;};
 },[]);
 useEffect(()=>{setSelected(null)},[day]);
 useEffect(()=>{
  if(!ready)return;let live=true;
  import('leaflet').then(({default:L})=>{
   if(!live||!map.current||!layers.current)return;
   const m=map.current,group=layers.current;group.clearLayers();const bounds: [number,number][]=[];
   const chengdu:[number,number]=[30.66,104.06],zhangjiajie:[number,number]=[29.12,110.48],moscow:[number,number]=[55.75,37.62];
   function city(coords:[number,number],name:string){bounds.push(coords);L.circleMarker(coords,{radius:7,color:'#fff',weight:2,fillColor:'#a3352c',fillOpacity:1}).bindTooltip(name,{permanent:true,direction:'top'}).addTo(group);}
   if(day==='all'||day===3||day===7){city(chengdu,'Чэнду');city(zhangjiajie,'Чжанцзяцзе');L.polyline([chengdu,zhangjiajie],{color:'#a3352c',weight:3,dashArray:'10 7'}).bindTooltip('Поезд: день 3 → Чжанцзяцзе · день 7 → Чэнду. Схема, не железнодорожная трасса.').addTo(group);}
   if(day==='departure'||day===8){city(moscow,'Москва');city(chengdu,'Чэнду');L.polyline([moscow,chengdu],{color:'#b58a38',weight:2,dashArray:'3 8'}).bindTooltip('Перелёт · схематично между городами').addTo(group);}
   if(day===7)city(chengdu,'Чэнду · прогулка и опера');
   const current=places.filter(p=>day==='all'||typeof day==='number'&&p.days.includes(day));
   if(typeof day==='number'&&current.length>1)L.polyline(current.map(p=>[p.lat,p.lng] as [number,number]),{color:'#527566',weight:2,dashArray:'3 6'}).bindTooltip('Связь между местами дня. Порядок и путь трансфера уточняются.').addTo(group);
   for(const p of current){
    bounds.push([p.lat,p.lng]);
    const icon=L.divIcon({className:'tour-map-marker',html:'<span>'+p.days[0]+'</span>',iconSize:[32,32],iconAnchor:[16,16]});
    L.marker([p.lat,p.lng],{icon,keyboard:true,title:p.title}).bindTooltip(p.title).on('click',()=>setSelected(p.id)).addTo(group);
   }
   if(bounds.length)m.fitBounds(bounds,{padding:[45,45],maxZoom:13});
  });return()=>{live=false;};
 },[ready,day]);
 function focus(id:string){const p=places.find(p=>p.id===id);if(p){setSelected(id);map.current?.flyTo([p.lat,p.lng],14,{duration:.6});}}
 return <section className="china-map-section" aria-label="Карта мест и перемещений">
  <div className="china-map-heading"><div><p className="china-eyebrow">НАШ МАРШРУТ НА КАРТЕ</p><h2>{day==='all'?'От чайных улиц к горным вершинам':day==='departure'?'26 октября · вылет в Китай':`День ${day} · ${tour.days.find(d=>d.day===day)?.city}`}</h2></div><button className="secondary" onClick={()=>onDay('all')}>Весь маршрут</button></div>
  <div className="china-map-layout"><div><div className="china-map-canvas" ref={node} aria-label="Интерактивная карта Китая"/>{error&&<p role="status" className="china-map-note">{error}</p>}<div className="china-map-key"><span>● Места · номер дня</span><span>━ ━ Поезд</span><span>··· Перемещения</span></div><p className="china-map-note">Линии — схема перемещений, не точная трасса. Точки обозначают достопримечательности, не места встречи с гидом. © OpenStreetMap contributors.</p></div>
   <aside className="china-map-aside">{place?<><img src={place.image} alt={place.title}/><small>{place.chinese}</small><h3>{place.title}</h3><p>{place.description}</p><a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">Открыть на карте ↗</a><p className="tour-photo-credit"><a href={place.photoSource} target="_blank" rel="noreferrer">{place.author}</a> · {place.license} · кадрирование</p></>:<><p className="china-eyebrow">ВЫБЕРИТЕ МЕСТО</p><h3>{active.length?'Каждая точка — новая история':'День переезда'}</h3><p>{active.length?'Нажмите на маркер или название, чтобы увидеть фотографию и описание.':'Точные аэропорты, вокзалы и места встреч добавим после подтверждения билетов.'}</p></>}
    <div className="china-map-places">{active.map(p=><button key={p.id} className={selected===p.id?'selected':''} onClick={()=>focus(p.id)}><span>{p.days[0]}</span>{p.title}</button>)}</div>
   </aside>
  </div>
 </section>;
}
