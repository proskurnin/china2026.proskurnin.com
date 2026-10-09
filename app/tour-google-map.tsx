/// <reference types="google.maps" />
'use client';
import {useEffect,useRef,useState} from 'react';
import {setOptions,importLibrary} from '@googlemaps/js-api-loader';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import {routeForDay,type TourDay} from '@/lib/tour-route';
import places from '@/data/tour-places.json';
let loading:Promise<void>|undefined;
function loadMaps(){return loading??=(async()=>{
 const response=await fetch('/maps-config.json');if(!response.ok)throw Error('Missing configuration');
 const {key}=await response.json() as {key?:unknown};if(typeof key!=='string'||!key)throw Error('Missing key');
 setOptions({key,v:'weekly',language:'ru'});await Promise.all([importLibrary('maps'),importLibrary('marker')]);
})().catch(error=>{loading=undefined;throw error;});}
export default function TourGoogleMap({day,selected,onSelect,onFallback}:{day:TourDay;selected:string|null;onSelect:(id:string)=>void;onFallback:()=>void}){
 const node=useRef<HTMLDivElement>(null),map=useRef<google.maps.Map|null>(null),callback=useRef(onSelect);callback.current=onSelect;
 const [ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{let live=true;const fail=()=>{if(live)setError(true);};const old=(window as any).gm_authFailure;(window as any).gm_authFailure=fail;
  loadMaps().then(()=>{if(!live||!node.current)return;map.current=new google.maps.Map(node.current,{center:{lat:40,lng:80},zoom:3,mapId:'DEMO_MAP_ID',gestureHandling:'cooperative',mapTypeControl:true,streetViewControl:false,fullscreenControl:true});setReady(true);}).catch(fail);
  return()=>{live=false;if(map.current)google.maps.event.clearInstanceListeners(map.current);map.current=null;if((window as any).gm_authFailure===fail)(window as any).gm_authFailure=old;};
 },[]);
 useEffect(()=>{if(!ready||!map.current)return;const m=map.current,bounds=new google.maps.LatLngBounds(),data=routeForDay(day),lines:google.maps.Polyline[]=[],markers:google.maps.marker.AdvancedMarkerElement[]=[];
  for(const t of data.activeTransfers){const path=t.path.map(([lat,lng])=>({lat,lng}));path.forEach(p=>bounds.extend(p));lines.push(new google.maps.Polyline({map:m,path,strokeColor:t.color,strokeOpacity:.9,strokeWeight:t.mode==='flight'?2.5:3,icons:[{icon:{path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW,scale:3,strokeColor:t.color,fillColor:t.color,fillOpacity:1},offset:'55%'}]}));
   const text=document.createElement('span');text.className='tour-transfer-label';text.style.color=t.color;text.textContent=t.label;const [lat,lng]=t.path[20];markers.push(new google.maps.marker.AdvancedMarkerElement({map:m,position:{lat,lng},content:text,title:t.title+' · схема'}));}
  for(const line of data.localLines)lines.push(new google.maps.Polyline({map:m,path:line.path.map(([lat,lng])=>({lat,lng})),strokeColor:'#628676',strokeOpacity:.6,strokeWeight:2}));
  for(const stop of data.stops){const [lat,lng]=stop.point;bounds.extend({lat,lng});const text=document.createElement('span');text.className='tour-stop-label';text.textContent=stop.title;markers.push(new google.maps.marker.AdvancedMarkerElement({map:m,position:{lat,lng},content:text,title:stop.title}));}
  const placeMarkers:google.maps.marker.AdvancedMarkerElement[]=[];
  for(const p of data.activePlaces){bounds.extend({lat:p.lat,lng:p.lng});const pin=document.createElement('span');pin.className='tour-google-pin';pin.textContent=String(p.days[0]);const marker=new google.maps.marker.AdvancedMarkerElement({map:m,position:{lat:p.lat,lng:p.lng},content:pin,title:p.title,gmpClickable:true});marker.addListener('click',()=>callback.current(p.id));markers.push(marker);placeMarkers.push(marker);}
  const cluster=new MarkerClusterer({map:m,markers:placeMarkers});
  let idle:google.maps.MapsEventListener|undefined;if(!bounds.isEmpty()){m.fitBounds(bounds,55);idle=google.maps.event.addListenerOnce(m,'idle',()=>{if((m.getZoom()||0)>13)m.setZoom(13);});}
  return()=>{idle?.remove();cluster.clearMarkers();cluster.setMap(null);markers.forEach(marker=>{google.maps.event.clearInstanceListeners(marker);marker.map=null;});lines.forEach(line=>line.setMap(null));};
 },[ready,day]);
 useEffect(()=>{if(!ready||!selected)return;const p=places.find(p=>p.id===selected);if(p){map.current?.panTo({lat:p.lat,lng:p.lng});map.current?.setZoom(14);}},[ready,selected]);
 return <div className="tour-map-holder"><div className="china-map-canvas" ref={node} aria-label="Интерактивная карта Google Maps"/>{error&&<div className="tour-map-error" role="status"><b>Google Maps пока недоступна для этого домена.</b><p>Можно продолжить с OpenStreetMap — все места и маршруты сохранятся.</p><button className="secondary" onClick={onFallback}>Открыть OpenStreetMap</button></div>}</div>;
}
