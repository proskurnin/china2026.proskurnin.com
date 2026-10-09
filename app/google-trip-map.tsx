/// <reference types="google.maps" />
'use client';
import {useEffect,useRef,useState} from 'react';
import type {Trip} from '@/lib/trip';
import {setOptions,importLibrary} from '@googlemaps/js-api-loader';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
let loading:Promise<void>|undefined;
function loadMaps(){
 return loading??=(async()=>{
  const response=await fetch('/maps-config.json');
  if(!response.ok)throw new Error('Map configuration unavailable');
  const {key}=await response.json() as {key?:string};
  if(typeof key!=='string'||!key)throw new Error('Map key missing');
  setOptions({key,v:'weekly',language:'ru'});
  await Promise.all([importLibrary('maps'),importLibrary('marker')]);
 })();
}
export default function TripMap({plan,visits,day,selected,onSelect,overview=false}:{plan:Trip;visits:any[];day:any;selected:any;onSelect:(v:any)=>void;overview?:boolean}){
 const node=useRef<HTMLDivElement>(null),map=useRef<google.maps.Map|null>(null),callback=useRef(onSelect);
 callback.current=onSelect;
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let live=true;
  const authError=()=>{if(live)setError('Google Maps не настроена для этого адреса. Выберите OpenStreetMap — все места и переезды сохранены.');};
  (window as any).gm_authFailure=authError;
  loadMaps().then(()=>{
   if(!live||!node.current)return;
   map.current=new google.maps.Map(node.current,{center:{lat:47,lng:19},zoom:4,mapId:'DEMO_MAP_ID',gestureHandling:'cooperative',mapTypeControl:false,streetViewControl:false,fullscreenControl:true,zoomControl:true});
   setReady(true);
  }).catch(authError);
  return()=>{live=false;if(map.current)google.maps.event.clearInstanceListeners(map.current);map.current=null;if((window as any).gm_authFailure===authError)delete (window as any).gm_authFailure;};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  const m=map.current,bounds=new google.maps.LatLngBounds();
  const lines:google.maps.Polyline[]=[],markers:google.maps.marker.AdvancedMarkerElement[]=[];
  for(const t of plan.transfers.filter(t=>overview||!day||t.date===day.date)){
   const f=plan.cities[t.from],to=plan.cities[t.to];if(!f||!to)continue;
   const path=[{lat:f[1],lng:f[2]},{lat:to[1],lng:to[2]}];
   lines.push(new google.maps.Polyline({map:m,path,geodesic:t.mode==='flight',strokeOpacity:0,strokeWeight:2.5,icons:[{icon:{path:'M 0,-1 0,1',strokeOpacity:.8,strokeColor:t.mode==='flight'?'#c68138':t.mode==='unknown'?'#7a7f89':'#217785',scale:2.5},offset:'0',repeat:t.mode==='unknown'?'14px':'10px'}]}));
   if(overview)path.forEach(p=>bounds.extend(p));
  }
  const symbols:Record<string,string>={sight:'◆',rest:'♧',food:'◉',hotel:'▰',airport:'✈',station:'▤'};
  // Group repeat visits at the same place so none are hidden behind another marker.
  const groups=new Map<string,any[]>();
  for(const v of visits){const p=plan.places.find(x=>x.id===v.placeId);if(!p)continue;const group=groups.get(p.id)||[];group.push(v);groups.set(p.id,group);}
  const info=new google.maps.InfoWindow();
  for(const [placeId,group] of groups){
   const p=plan.places.find(x=>x.id===placeId)!;const v=group.find(v=>v.id===selected?.id)||group[0];
   const position={lat:p.lat,lng:p.lng};bounds.extend(position);
   const pin=document.createElement('span');pin.className='pin '+(group.some(v=>v.id===selected?.id)?'selected ':'')+v.category;pin.textContent=symbols[v.category]||'•';
   const marker=new google.maps.marker.AdvancedMarkerElement({position,title:group.map(v=>v.title).join(' / '),content:pin,gmpClickable:true});
   marker.addListener('click',()=>{
    if(group.length===1){callback.current(v);return;}
    const list=document.createElement('div');list.style.cssText='display:grid;gap:8px;max-width:260px';
    for(const visit of group){const button=document.createElement('button');button.textContent=plan.days.find(d=>d.id===visit.dayId)?.date+' · '+(visit.start||'')+' '+visit.title;button.style.cssText='padding:8px;text-align:left;cursor:pointer;color:#234758;background:#edf4f5;border:0;border-radius:5px';button.onclick=()=>{info.close();callback.current(visit);};list.appendChild(button);}
    info.setContent(list);info.open({map:m,anchor:marker});
   });markers.push(marker);
  }
  const cluster=new MarkerClusterer({map:m,markers});
  let idle:google.maps.MapsEventListener|undefined;
  if(selected){const p=plan.places.find(x=>x.id===selected.placeId);if(p){m.panTo({lat:p.lat,lng:p.lng});m.setZoom(p.category==='city'?11:15);}}
  else if(!bounds.isEmpty()){m.fitBounds(bounds,55);idle=google.maps.event.addListenerOnce(m,'idle',()=>{const cap=overview?5:13;if((m.getZoom()||0)>cap)m.setZoom(cap);});}
  else if(day){const c=plan.cities[day.city];if(c){m.panTo({lat:c[1],lng:c[2]});m.setZoom(11);}}
  return()=>{idle?.remove();info.close();cluster.clearMarkers();cluster.setMap(null);markers.forEach(marker=>{google.maps.event.clearInstanceListeners(marker);marker.map=null;});lines.forEach(line=>line.setMap(null));};
 },[ready,plan,visits,day,selected,overview]);
 return <div className="mapwrap"><div ref={node} className="map" aria-label="Интерактивная карта Google Maps"/><div className="map-label"><span className="live-dot"/>{overview?'Весь маршрут':day?.title||'Маршрут'}<small>ЛИНИИ СХЕМАТИЧНЫЕ</small></div><div className="map-legend"><span>◆ Место</span><span>▰ Жильё</span><span>◉ Еда</span><span>✈ Аэропорт</span><span>▤ Вокзал / переезд</span><span>♧ Отдых</span><span className="air-line">Перелёт</span><span className="rail-line">Поезд</span><span>··· Транспорт уточняется</span></div>{error&&<p className="map-error" role="status">{error}</p>}</div>
}
