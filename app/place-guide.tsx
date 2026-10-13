'use client';
import type {PlaceGuide as Guide,GuideParagraph} from '@/lib/place-guide';
import {useState} from 'react';
function GuidePhoto({photo}:{photo:Guide['photos'][number]}){
 const [failed,setFailed]=useState(false);
 return <figure>{photo.url&&!failed&&<a href={photo.pageUrl} target="_blank" rel="noreferrer"><img src={photo.url} alt={photo.title} loading="lazy" decoding="async" onError={()=>setFailed(true)}/></a>}<figcaption><a href={photo.pageUrl} target="_blank" rel="noreferrer">{photo.title} ↗</a>{photo.author&&<> · {photo.author}</>}{photo.license&&<> · {photo.licenseUrl?<a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>:photo.license}</>}</figcaption></figure>;
}
export default function PlaceGuide({guide,expanded=false}:{guide:Guide;expanded?:boolean}) {
 const references=(ids:string[])=>ids.map(id=>guide.sources.find(s=>s.id===id)).filter(s=>s!==undefined);
 const paragraphs=(items:GuideParagraph[])=>items.map((p,i)=><li key={i}><p>{p.text}</p><span className="place-guide-citations">{references(p.sourceIds).map(s=><a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</span></li>);
 const sections:[string,GuideParagraph[]][]=[['Что посмотреть',guide.highlights],['Практические советы',guide.tips],['Билеты и посещение',guide.practical]];
 return <details className="place-guide" open={expanded||undefined}><summary>Путеводитель: что посмотреть и как подготовиться <span aria-hidden="true">＋</span></summary><div className="place-guide-body">
  {guide.identityNote&&<p className="place-guide-note">{guide.identityNote}</p>}
  {guide.mediaNote&&<p className="place-guide-label">{guide.mediaNote}</p>}
  {guide.overview.length>0&&<ul className="place-guide-overview">{paragraphs(guide.overview)}</ul>}
  {sections.filter(([,items])=>items.length>0).map(([title,items])=><section key={title}><h4>{title}</h4><ul>{paragraphs(items)}</ul></section>)}
  {guide.reviews.length>0&&<section><h4>Впечатления посетителей</h4><p className="place-guide-label">Пересказ отзывов · субъективные впечатления</p>{guide.reviews.map((review,i)=><div className="place-guide-review" key={i}><p>{review.text}</p>{review.publishedAt&&<small>Дата отзыва: {review.publishedAt}</small>}<span className="place-guide-citations">{references(review.sourceIds).map(s=><a href={s.url} key={s.id} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</span></div>)}</section>}
  {guide.photos.length>0&&<section><h4>Фотографии</h4><div className="place-guide-photos">{guide.photos.map(photo=><GuidePhoto key={photo.pageUrl} photo={photo}/>)}</div></section>}
  {guide.videos.length>0&&<section><h4>Посмотреть перед поездкой</h4><div className="place-guide-videos">{guide.videos.map(video=><article key={video.url}><a href={video.url} target="_blank" rel="noreferrer">▶ {video.title} ↗</a>{video.channel&&<p>{video.channel}</p>}{video.note&&<p>{video.note}</p>}<small>{video.publishedAt&&<>Опубликовано: {video.publishedAt} · </>}Ссылка проверена: {video.checkedAt}</small></article>)}</div></section>}
  {guide.sources.length>0&&<section className="place-guide-sources"><h4>Источники и даты проверки</h4><ul>{guide.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><small>{source.publishedAt&&<> · опубликовано {source.publishedAt}</>} · проверено {source.checkedAt}</small></li>)}</ul></section>}
 </div></details>;
}
