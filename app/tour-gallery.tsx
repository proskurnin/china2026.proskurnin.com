'use client';
import places from '@/data/tour-places.json';
import {tourDate} from '@/lib/tour-route';
import {PlacePhoto} from './tour-day-places';

export default function TourGallery({onDay}:{onDay:(day:number)=>void}) {
 return <section className="china-section tour-gallery" aria-labelledby="tour-gallery-title">
  <div className="tour-gallery-heading"><div className="china-section-heading"><p className="china-eyebrow">山水之间 · МЕЖДУ ГОРАМИ И ВОДОЙ</p><h2 id="tour-gallery-title">Места, которые нас ждут</h2><p className="tour-gallery-lead">Храмовые дворы, бамбук и горы в дымке — наш маршрут в фотографиях. У каждого кадра своя дата и свой день путешествия.</p></div><span className="tour-album-seal" aria-hidden="true">中国<br/>之旅</span></div>
  <div className="tour-gallery-grid">{places.map((place,index)=><article className={`tour-gallery-card${index===0?' tour-gallery-wide':''}`} key={place.id}>
   <div className="tour-gallery-picture"><PlacePhoto place={place}/><span className="tour-gallery-date">{tourDate(place.days[0])} 2026</span></div>
   <div className="tour-gallery-copy"><span className="tour-gallery-chinese" lang="zh">{place.chinese}</span><h3>{place.title}</h3><button onClick={()=>onDay(place.days[0])}>Программа дня {place.days[0]} <span aria-hidden="true">↗</span></button></div>
  </article>)}</div>
  <p className="tour-gallery-note">Фотографии мест до поездки · даты программы предварительные</p>
 </section>;
}
