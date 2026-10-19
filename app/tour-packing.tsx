'use client';
type Category={title:string;items:string[];note?:string};
type Packing={title:string;intro:string;categories:Category[];powerbank:Category&{sources:{label:string;url:string}[]}};
type TourPayment={currency:string;perPerson:number;travelers:string[];total:number;description:string;status:string;source:string};
export type PrivateTour={prices:{label:string;amount:number}[];questions:string[];packing?:Packing|null;tourPayment?:TourPayment|null;flightCost?:{currency:string;perPerson:number;travelers:string[];total:number;description:string;source:string}|null};
export default function PackingList({packing}:{packing?:Packing|null}){
 if(!packing)return <ElectricityGuide/>;
 return <div className="tour-packing"><h1 className="china-page-title">{packing.title}</h1><p className="china-disclaimer">{packing.intro}</p><ElectricityGuide/><div className="china-info-grid">{packing.categories.map(category=><article key={category.title}><h2>{category.title}</h2><ul>{category.items.map(item=><li key={item}><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul>{category.note&&<p className="china-disclaimer">{category.note}</p>}</article>)}</div><article className="tour-packing-power"><h2>{packing.powerbank.title}</h2><ul>{packing.powerbank.items.map(item=><li key={item}>{item}</li>)}</ul><p>{packing.powerbank.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}</p></article></div>;
}

function ElectricityGuide(){
 return <section className="tour-packing-power" aria-labelledby="china-electricity-title">
  <p className="china-eyebrow">用电 · ЗАРЯДКИ В ПОЕЗДКЕ</p>
  <h2 id="china-electricity-title">Розетки в Китае: переходник лучше взять</h2>
  <p><strong>220 В · 50 Гц.</strong> Для Чэнду и Чжанцзяцзе возьмите переходник с российской / европейской вилки на китайскую розетку типа I. У универсального адаптера проверьте поддержку Китая и совместимость с вашей вилкой.</p>
  <div className="china-info-grid">
   <article><h3>Тип A</h3><p>Два плоских параллельных контакта. Похож на американский, но напряжение здесь 220 В.</p></article>
   <article><h3>Тип I</h3><p>Два плоских наклонных контакта и контакт заземления. Именно этот вариант стоит предусмотреть в дорожном адаптере.</p></article>
   <article><h3>Тип C и российские вилки</h3><p>Два круглых штыря Europlug могут подойти к совместимой розетке. Не рассчитывайте на это во всех отелях; для массивной вилки типа F также предусмотрите переходник.</p></article>
  </div>
  <h3>Телефоны, камеры и ноутбук</h3>
  <p>Проверьте надпись <strong>Input: 100–240 V, 50/60 Hz</strong> на каждой зарядке. При такой маркировке преобразователь напряжения не нужен — только подходящий переходник.</p>
  <p><strong>В список вещей:</strong> 1–2 переходника для Китая и многопортовая USB-зарядка. Это рекомендация для поездки; тип розеток в наших номерах пока не подтверждён.</p>
  <p>Переходник не меняет напряжение. Приборы только на 110–120 В напрямую подключать нельзя. Для приборов с заземлением нужен адаптер, сохраняющий заземление; соблюдайте его предел мощности.</p>
  <p className="china-disclaimer">Проверено 19 октября 2026 · <a href="https://www.electricalsafetyfirst.org.uk/safety-advice/travel-advice/china/" target="_blank" rel="noopener noreferrer">Electrical Safety First: розетки и напряжение</a><a href="https://www.electricalsafetyfirst.org.uk/safety-advice/products-and-appliances/gadgets-entertainment/travel-adaptors/" target="_blank" rel="noopener noreferrer">Как выбрать переходник</a></p>
 </section>;
}
