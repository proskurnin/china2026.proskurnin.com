'use client';
import {useEffect,useRef,useState} from 'react';
import {routeForDay,type TourDay,type Point} from '@/lib/tour-route';
import places from '@/data/tour-places.json';
import 'leaflet/dist/leaflet.css';
export default function TourOsmMap({day,selected,onSelect}:{day:TourDay;selected:string|null;onSelect:(id:string)=>void}){
 const node=useRef<HTMLDivElement>(null),map=useRef<import('leaflet').Map|null>(null),layers=useRef<import('leaflet').LayerGroup|null>(null),callback=useRef(onSelect);callback.current=onSelect;
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let live=true;let observer:ResizeObserver|undefined;import('leaflet').then(({default:L})=>{if(!live||!node.current)return;const m=L.map(node.current,{scrollWheelZoom:false}).setView([40,80],3);map.current=m;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m).on('tileerror',()=>setError('Подложка временно недоступна. Места и маршруты остаются в списке.'));layers.current=L.layerGroup().addTo(m);observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(node.current);setReady(true);}).catch(()=>setError('Не удалось загрузить карту.'));return()=>{live=false;observer?.disconnect();map.current?.remove();map.current=null;};},[]);
 useEffect(()=>{if(!ready)return;let live=true;import('leaflet').then(({default:L})=>{if(!live||!map.current||!layers.current)return;const m=map.current,group=layers.current;group.clearLayers();const bounds:Point[]=[],data=routeForDay(day);
  for(const t of data.activeTransfers){bounds.push(...t.path);L.polyline(t.path,{color:t.color,weight:3,dashArray:t.mode==='flight'?'7 5':undefined}).bindTooltip(t.title+' · '+t.label+' · схема').addTo(group);const text=document.createElement('span');text.className='tour-transfer-label';text.style.color=t.color;text.textContent=t.title+' · '+t.label;L.marker(t.path[20],{icon:L.divIcon({html:text,className:'tour-transfer-marker',iconSize:[180,24],iconAnchor:[90,12]})}).addTo(group);}
  for(const line of data.localLines)L.polyline(line.path,{color:'#628676',weight:2,dashArray:'3 6'}).bindTooltip('Связь между местами дня · схематично').addTo(group);
  for(const stop of data.stops){bounds.push(stop.point);L.circleMarker(stop.point,{radius:7,color:'#fff',weight:2,fillColor:'#a3352c',fillOpacity:1}).bindTooltip(stop.title,{permanent:true,direction:'top'}).addTo(group);}
  for(const p of data.activePlaces){bounds.push([p.lat,p.lng]);const icon=L.divIcon({className:'tour-map-marker',html:'<span>'+p.days[0]+'</span>',iconSize:[32,32],iconAnchor:[16,16]});L.marker([p.lat,p.lng],{icon,keyboard:true,title:p.title}).bindTooltip(p.title).on('click',()=>callback.current(p.id)).addTo(group);}
  if(bounds.length)m.fitBounds(bounds,{padding:[50,50],maxZoom:13});});return()=>{live=false;};},[ready,day]);
 useEffect(()=>{const p=places.find(p=>p.id===selected);if(ready&&p)map.current?.flyTo([p.lat,p.lng],14,{duration:.6});},[ready,selected]);
 return <><div className="china-map-canvas" ref={node} aria-label="Интерактивная карта OpenStreetMap"/>{error&&<p className="china-map-note" role="status">{error}</p>}</>;
}
