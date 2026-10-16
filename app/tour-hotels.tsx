const googleMaps = (query:string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const chengdu = {
 name:'Holiday Inn Express Chengdu Tianfu Square', city:'Чэнду · 成都',
 links:[
  {label:'Сайт IHG',url:'https://www.ihg.com/holidayinnexpress/hotels/ru/ru/chengdu/ctuts/hoteldetail'},
  {label:'Booking.com',url:'https://www.booking.com/hotel/cn/holiday-inn-express-chengdu-tianfu-square-an-ihg.html'},
  {label:'Google Maps',url:googleMaps('Holiday Inn Express Chengdu Tianfu Square, 52 Jindun Road, Chengdu, China')}
 ]
};
const hotels = [
 {...chengdu,checkIn:'2026-10-27',checkOut:'2026-10-29',dates:'27–29 октября',nights:'2 ночи'},
 {name:'Hampton by Hilton Zhangjiajie Seventy Two Wonder Towers',city:'Чжанцзяцзе · 张家界',checkIn:'2026-10-29',checkOut:'2026-10-30',dates:'29–30 октября',nights:'1 ночь',links:[
  {label:'Сайт Hilton',url:'https://www.hilton.com/en/hotels/dygwshx-hampton-zhangjiajie-seventy-two-wonder-towers/'},
  {label:'Google Maps',url:googleMaps('Hampton by Hilton Zhangjiajie Seventy Two Wonder Towers, Zhangjiajie, China')}
 ]},
 {name:'Zhangjiajie National Forest Park Mercure Hotel',city:'Чжанцзяцзе · 张家界',checkIn:'2026-10-30',checkOut:'2026-11-01',dates:'30 октября — 1 ноября',nights:'2 ночи',links:[
  {label:'Trip.com',url:'https://www.trip.com/hotels/zhangjiajie-hotel-detail-135989363/zhangjiajie-national-forest-park-mercure-hotel/'},
  {label:'Google Maps',url:googleMaps('Zhangjiajie National Forest Park Mercure Hotel 张家界国家森林公园美居酒店')}
 ]},
 {...chengdu,checkIn:'2026-11-01',checkOut:'2026-11-02',dates:'1–2 ноября',nights:'1 ночь'}
];
export default function TourHotels(){
 return <section className="tour-stays" aria-label="Отели и даты проживания">
  <div className="china-section-heading"><p className="china-eyebrow">旅居 · ГДЕ ОСТАНОВИМСЯ</p><h2>Отели нашего путешествия</h2></div>
  <p className="tour-stays-intro">27 октября — 2 ноября 2026 · 6 ночей. Начинаем и завершаем поездку в одном отеле в Чэнду; в Чжанцзяцзе — две остановки.</p>
  <div className="tour-stays-grid">{hotels.map((hotel,i)=><article className="tour-stay" key={hotel.checkIn}>
   <div className="tour-stay-meta"><span>{hotel.city}</span><b aria-hidden="true">0{i+1}</b></div>
   <h3>{hotel.name}</h3><p className="tour-stay-date">{hotel.dates} 2026 · {hotel.nights}</p>
   <p>Заезд <time dateTime={hotel.checkIn}>{hotel.checkIn.slice(8)}.{hotel.checkIn.slice(5,7)}</time> · Выезд <time dateTime={hotel.checkOut}>{hotel.checkOut.slice(8)}.{hotel.checkOut.slice(5,7)}</time></p>
   <div className="tour-stay-links">{hotel.links.map(link=><a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}</div>
  </article>)}</div>
 </section>;
}
