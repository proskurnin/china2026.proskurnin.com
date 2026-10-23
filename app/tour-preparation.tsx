'use client';
import {useEffect,useRef,useState} from 'react';
import {api,type User} from '@/lib/account-client';
import type {Packing} from './tour-packing';
type Saved={checked:Record<string,boolean>;notes:string};
type Storage={items:Record<string,{value:string;revision:number}>};
const itemId=(category:string,item:string)=>(category+'::'+item).slice(0,300);
// Private «Подготовка»: the organiser's packing list as our checklist plus own notes, stored per account (/api/trip/storage, key "packing").
export default function Preparation({packing,user}:{packing?:Packing|null;user:User}){
 const [data,setData]=useState<Saved>({checked:{},notes:''}),[status,setStatus]=useState('Загружаем отметки…');
 const latest=useRef(data),revision=useRef(0),loaded=useRef(false),timer=useRef(0),queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{let live=true;api<Storage>('/api/trip/storage').then(r=>{if(!live)return;const row=r.items.packing;if(row){revision.current=row.revision;try{const v=JSON.parse(row.value);latest.current={checked:v.checked||{},notes:v.notes||''};setData(latest.current);}catch{}}loaded.current=true;setStatus('');}).catch(e=>{if(live)setStatus((e as Error).message);});return()=>{live=false;window.clearTimeout(timer.current);};},[]);
 const save=(next:Saved)=>{latest.current=next;setData(next);if(!loaded.current)return;setStatus('Сохраняем…');window.clearTimeout(timer.current);
  timer.current=window.setTimeout(()=>{queue.current=queue.current.then(async()=>{try{const r=await api<{row:{revision:number}}>('/api/trip/storage','PUT',{accountId:user.id,key:'packing',value:JSON.stringify(latest.current),revision:revision.current});revision.current=r.row.revision;setStatus('Сохранено');}catch(e){setStatus((e as Error).message);}});},500);};
 const toggle=(id:string,on:boolean)=>{const checked={...latest.current.checked};if(on)checked[id]=true;else delete checked[id];save({...latest.current,checked});};
 if(!packing)return <section className="china-section"><h1 className="china-page-title">Подготовка</h1><p className="china-disclaimer">Список вещей пока не загружен.</p></section>;
 const ids=packing.categories.flatMap(c=>c.items.map(item=>itemId(c.title,item))),done=ids.filter(id=>data.checked[id]).length;
 return <section className="china-section tour-preparation"><p className="china-eyebrow">ТОЛЬКО ДЛЯ НАС</p><h1 className="china-page-title">Собираем чемодан</h1>
  <p className="china-disclaimer">{packing.intro} Отметки и заметки видите только вы: они сохраняются в вашем аккаунте и доступны с любого устройства.</p>
  <div className="prep-progress"><b>Собрано {done} из {ids.length}</b><span className="prep-bar"><span style={{width:(ids.length?done/ids.length*100:0)+'%'}}/></span>{status&&<small role="status">{status}</small>}</div>
  <div className="china-info-grid">{packing.categories.map(c=><article key={c.title}><h2>{c.title}</h2><ul className="prep-list">{c.items.map(item=>{const id=itemId(c.title,item);return <li key={item}><label><input type="checkbox" checked={!!data.checked[id]} onChange={e=>toggle(id,e.target.checked)}/><span>{item}</span></label></li>;})}</ul>{c.note&&<p className="china-disclaimer">{c.note}</p>}</article>)}
   <article><h2>Не забыть</h2><textarea className="prep-notes" value={data.notes} maxLength={20000} rows={8} placeholder="Свои вещи и дела перед вылетом" onChange={e=>save({...latest.current,notes:e.target.value})}/></article></div>
 </section>;
}
