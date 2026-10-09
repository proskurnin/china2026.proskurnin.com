import places from '@/data/tour-places.json';
export type TourDay=number|'all'|'departure'|'return';
export type Point=[number,number];
export const routeStops={
 svo:{id:'svo',title:'Шереметьево · SVO',point:[55.9726,37.4146] as Point},
 chengdu:{id:'chengdu',title:'Чэнду · аэропорт уточняется',point:[30.66,104.06] as Point},
 zhangjiajie:{id:'zhangjiajie',title:'Чжанцзяцзе',point:[29.12,110.48] as Point},
};
// Curves separate the two directions visually. They are not flight or railway tracks.
function curve(from:Point,to:Point,bend:number):Point[]{
 const dx=to[1]-from[1],dy=to[0]-from[0],length=Math.hypot(dx,dy)||1;
 const mid:Point=[(from[0]+to[0])/2+dx/length*bend,(from[1]+to[1])/2-dy/length*bend];
 return Array.from({length:41},(_,i)=>{const t=i/40,u=1-t;return [u*u*from[0]+2*u*t*mid[0]+t*t*to[0],u*u*from[1]+2*u*t*mid[1]+t*t*to[1]];});
}
export const transfers=[
 {id:'outbound',day:'departure' as TourDay,mode:'flight',title:'Шереметьево → Чэнду',label:'26 октября · туда',color:'#b67d25',path:curve(routeStops.svo.point,routeStops.chengdu.point,8),note:'Дата и аэропорт вылета подтверждены. Время и аэропорт прибытия уточняются.'},
 {id:'train-out',day:3 as TourDay,mode:'train',title:'Чэнду → Чжанцзяцзе',label:'День 3 · поезд',color:'#287d78',path:curve(routeStops.chengdu.point,routeStops.zhangjiajie.point,.8),note:'G2451 · 17:13–22:18 по предложению; билеты не подтверждены.'},
 {id:'train-back',day:7 as TourDay,mode:'train',title:'Чжанцзяцзе → Чэнду',label:'День 7 · поезд',color:'#576bac',path:curve(routeStops.zhangjiajie.point,routeStops.chengdu.point,.8),note:'G2450 · 09:55–14:20 по предложению; билеты не подтверждены.'},
 {id:'return',day:'return' as TourDay,mode:'flight',title:'Чэнду → Шереметьево',label:'2 ноября · домой',color:'#ae4035',path:curve(routeStops.chengdu.point,routeStops.svo.point,8),note:'Возвращение 2 ноября в Шереметьево. Время и аэропорт вылета уточняются.'},
];
export function routeForDay(day:TourDay){
 const activePlaces=places.filter(p=>day==='all'||typeof day==='number'&&p.days.includes(day));
 const activeTransfers=transfers.filter(t=>day==='all'||t.day===day||day===8&&t.id==='return');
 const localLines=(day==='all'?[1,2,3,4,5,6]:typeof day==='number'?[day]:[]).map(d=>({day:d,path:places.filter(p=>p.days.includes(d)).map(p=>[p.lat,p.lng] as Point)})).filter(x=>x.path.length>1);
 const showFlights=activeTransfers.some(t=>t.mode==='flight');
 const stops=Object.values(routeStops).filter(s=>s.id==='svo'?showFlights:s.id==='zhangjiajie'?activeTransfers.some(t=>t.mode==='train'):activeTransfers.length>0);
 return {activePlaces,activeTransfers,localLines,stops};
}
