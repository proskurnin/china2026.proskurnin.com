'use client';
type Category={title:string;items:string[];note?:string};
type Packing={title:string;intro:string;categories:Category[];powerbank:Category&{sources:{label:string;url:string}[]}};
type TourPayment={currency:string;perPerson:number;travelers:string[];total:number;description:string;status:string;source:string};
export type PrivateTour={prices:{label:string;amount:number}[];questions:string[];packing?:Packing|null;tourPayment?:TourPayment|null;flightCost?:{currency:string;perPerson:number;travelers:string[];total:number;description:string;source:string}|null};
export default function PackingList({packing}:{packing?:Packing|null}){
 if(!packing)return <p className="china-disclaimer">Памятка по сборам появится после обновления сервиса участников.</p>;
 return <div className="tour-packing"><h1 className="china-page-title">{packing.title}</h1><p className="china-disclaimer">{packing.intro}</p><div className="china-info-grid">{packing.categories.map(category=><article key={category.title}><h2>{category.title}</h2><ul>{category.items.map(item=><li key={item}><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul>{category.note&&<p className="china-disclaimer">{category.note}</p>}</article>)}</div><article className="tour-packing-power"><h2>{packing.powerbank.title}</h2><ul>{packing.powerbank.items.map(item=><li key={item}>{item}</li>)}</ul><p>{packing.powerbank.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}</p></article></div>;
}
