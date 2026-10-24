import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import places from '@/data/tour-places.json';
import guides from '@/data/place-guides.json';
import type {PlaceGuide as Guide} from '@/lib/place-guide';
import PlaceGuide from '../../place-guide';
import {PlacePhoto,PlaceAlerts} from '../../tour-day-places';
import '../../tour-visuals.css';
import '../../tour-polish.css';
import './place-page.css';

export function generateStaticParams(){return places.map(place=>({slug:place.id}));}
export const dynamicParams=false;
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const place=places.find(p=>p.id===slug);
 return place?{title:place.title+' — Китай 2026',description:place.description,alternates:{canonical:'https://china2026.proskurnin.com/places/'+place.id+'/'}}:{title:'Место не найдено — Китай 2026'};
}
export default async function PlacePage({params}:Props){
 const {slug}=await params;const place=places.find(p=>p.id===slug);
 if(!place)notFound();
 const guide=(guides as Guide[]).find(g=>g.placeId===place.id);
 const nearby=places.filter(p=>p.id!==place.id&&p.days.some(day=>place.days.includes(day))).slice(0,3);
 const next=places[(places.findIndex(p=>p.id===place.id)+1)%places.length];
 return <main className="trip china-tour place-page">
  <header><a className="brand" href="/"><span className="china-seal" aria-hidden="true">中</span><b>Китай <em>2026</em></b></a><a className="place-back" href="/#tour-gallery-title">← Все места маршрута</a></header>
  <article className="place-page-content">
   <nav className="place-breadcrumbs" aria-label="Хлебные крошки"><a href="/">Маршрут</a><span aria-hidden="true">/</span><a href="/#tour-gallery-title">Места, которые нас ждут</a></nav>
   <div className="place-page-hero"><div><p className="china-eyebrow">ПУТЕВОДИТЕЛЬ · ДЕНЬ {place.days.join(', ')}</p><h1>{place.title}</h1><p className="place-page-lead">{place.description}</p><div className="place-page-actions"><a href={'https://www.google.com/maps/search/?api=1&query='+place.lat+','+place.lng} target="_blank" rel="noreferrer">Открыть на Google Maps ↗</a><a href={'https://www.openstreetmap.org/?mlat='+place.lat+'&mlon='+place.lng+'#map=16/'+place.lat+'/'+place.lng} target="_blank" rel="noreferrer">OpenStreetMap ↗</a></div><p className="place-page-date-note">День указан по предварительной программе. Дату посещения уточняем у организатора.</p></div><PlacePhoto place={place} priority/></div>
   <PlaceAlerts placeId={place.id}/>
   <nav className="place-page-nav" aria-label="На этой странице"><a href="#about">О месте</a><a href="#highlights">Что посмотреть</a><a href="#tips">Советы</a><a href="#practical">Посещение</a><a href="#photos">Фотографии</a><a href="#videos">Видео</a></nav>
   {guide&&<PlaceGuide guide={guide} standalone/>}
   <section className="place-page-more"><p className="china-eyebrow">ПРОДОЛЖИТЬ ПУТЕШЕСТВИЕ</p><h2>{nearby.length?'Ещё в программе этого дня':'Следующее место маршрута'}</h2><div>{(nearby.length?nearby:[next]).map(p=><a href={'/places/'+p.id+'/'} key={p.id}><span>{p.title}</span><span aria-hidden="true">↗</span></a>)}</div></section>
   <a className="place-back" href="/#tour-gallery-title">← Вернуться к местам маршрута</a>
  </article><footer><span>Китай 2026 · Наше путешествие</span><span>made with ♥ by Roman A. Proskurnin</span></footer>
 </main>;
}
