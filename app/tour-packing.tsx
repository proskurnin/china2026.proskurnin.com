'use client';
type Category={title:string;items:string[];note?:string};
type Packing={title:string;intro:string;categories:Category[];powerbank:Category&{sources:{label:string;url:string}[]}};
type TourPayment={currency:string;perPerson:number;travelers:string[];total:number;description:string;status:string;source:string};
export type PrivateTour={prices:{label:string;amount:number}[];questions:string[];packing?:Packing|null;tourPayment?:TourPayment|null;flightCost?:{currency:string;perPerson:number;travelers:string[];total:number;description:string;source:string}|null};
export default function PackingList({packing}:{packing?:Packing|null}){
 if(!packing)return <ElectricityGuide/>;
 return <div className="tour-packing"><h1 className="china-page-title">{packing.title}</h1><p className="china-disclaimer">{packing.intro}</p><div className="china-info-grid">{packing.categories.map(category=><article key={category.title}><h2>{category.title}</h2><ul>{category.items.map(item=><li key={item}><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul>{category.note&&<p className="china-disclaimer">{category.note}</p>}</article>)}</div><article className="tour-packing-power"><h2>{packing.powerbank.title}</h2><PowerbankNotice/><ul>{packing.powerbank.items.map(item=><li key={item}>{item}</li>)}</ul><p>{packing.powerbank.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}</p></article><ElectricityGuide/></div>;
}

function ElectricityGuide(){
 return <section className="tour-packing-power tour-power-guide" aria-labelledby="china-electricity-title">
  <p className="china-eyebrow">用电 · ПОЛЕЗНО В ПОЕЗДКЕ</p>
  <h2 id="china-electricity-title">Розетки и переходники</h2>
  <p className="tour-power-lead">Берём 1–2 переходника для Китая. Сеть — <strong>220 В / 50 Гц</strong>, а форма розеток отличается.</p>
  <div className="tour-power-photos">
   <figure><div className="tour-power-image"><img src="/images/power/china-socket.jpg" width="471" height="397" alt="Китайская комбинированная розетка: сверху два контакта, снизу три отверстия типа I" loading="lazy"/></div><figcaption><h3>Как выглядит розетка</h3><p>Снизу — тип I: два наклонных контакта и заземление. Сверху на этом фото — комбинированное гнездо. В других розетках российская вилка может не подойти.</p><small><a href="https://commons.wikimedia.org/wiki/File:Chinasocket.jpg" target="_blank" rel="noopener noreferrer">Фото: Archenbridge Universities / Lapin rossignol</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a></small></figcaption></figure>
   <figure><div className="tour-power-image"><img src="/images/power/china-adapter.jpg" width="600" height="600" alt="Пример переходника для Китая: вход для европейской вилки и три плоских контакта типа I" loading="lazy"/></div><figcaption><h3>Какой переходник искать</h3><p><strong>EU → CN / Type I</strong> — с входом под вашу вилку. Для вилки с заземлением нужен переходник, сохраняющий заземление.</p><small><a href="https://wazza.com.ua/ru/products/perehodnik-vilki-eu-us-uk-au-cn-na-tip-i-13a/" target="_blank" rel="noopener noreferrer">Фото и пример формы: Wazza</a> · иллюстрация, не рекомендация модели</small></figcaption></figure>
  </div>
  <div className="tour-power-takeaway"><strong>Зарядки для телефона, камер и ноутбука</strong><p>Если на блоке написано <b>Input: 100–240 V, 50/60 Hz</b>, преобразователь напряжения не нужен. Достаточно подходящего переходника; удобно взять многопортовую USB-зарядку.</p></div>
  <details><summary>Подробнее о совместимости</summary><p>В Китае используются типы A и I; встречаются гнёзда, совместимые с круглой вилкой C. Не рассчитывайте, что такая розетка будет у кровати в каждом отеле. Переходник не преобразует напряжение: приборы только на 110–120 В напрямую не подключайте. Не превышайте мощность, указанную на адаптере.</p><p>Проверено 19 октября 2026 · <a href="https://www.electricalsafetyfirst.org.uk/safety-advice/travel-advice/china/" target="_blank" rel="noopener noreferrer">Electrical Safety First</a>. Розетки в наших номерах пока не подтверждены.</p></details>
 </section>;
}

export function PowerbankNotice(){
 return <div className="tour-power-takeaway">
  <h3>CCC / 3C на корпусе — обязательно для внутренних рейсов Китая</h3>
  <p><strong>Проверьте на самом пауэрбанке чёткий заводской знак сертификации CCC (3C).</strong> С 28 июня 2025 года на внутренних рейсах Китая запрещены пауэрбанки без этого знака или с нечитаемой маркировкой. Проверяйте корпус устройства, а не только упаковку или описание в магазине.</p>
  <p>Наличие CCC само по себе не гарантирует допуск: модели и партии, отозванные производителем, запрещены. Также должны читаться энергетические характеристики устройства.</p>
  <p><strong>Для нашей поездки выбираем пауэрбанк с CCC на корпусе.</strong> Наши рейсы Москва — Чэнду — Москва международные: указанное требование CAAC касается внутренних перелётов, поэтому условия международного рейса проверяем у перевозчика.</p>
  <p>По правилам Sichuan Airlines: не более двух пауэрбанков на человека, только в ручной клади; до 100 Wh включительно — без отдельного согласования, свыше 100 до 160 Wh — с разрешением авиакомпании. На борту нельзя использовать или заряжать пауэрбанк и класть его на верхнюю багажную полку; защитите каждый от короткого замыкания.</p>
  <p><small>Проверено 21 октября 2026 · <a href="https://www.caac.gov.cn/English/News/202507/t20250709_227894.html" target="_blank" rel="noopener noreferrer">CAAC: CCC на внутренних рейсах</a> · <a href="https://serviceapp.sichuanair.com/views/staticinfo/static426cc5e3b67c429a8efed5cc226bbcbe.html" target="_blank" rel="noopener noreferrer">Sichuan Airlines: аккумуляторы и пауэрбанки</a></small></p>
 </div>;
}
