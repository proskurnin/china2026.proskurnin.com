export function effectiveTrip(trip, snapshot, now){
 const raw=snapshot?.flights?.[trip.id];
 const valid=raw&&raw.number===trip.number&&raw.date===trip.departure.slice(0,10)&&Number.isFinite(Date.parse(raw.checkedAt));
 const live=valid?raw:null;
 const validTime=t=>typeof t==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(t)&&Number.isFinite(Date.parse(t));
 const departure=live&&validTime(live.departure)?live.departure:trip.departure;
 const arrival=live&&validTime(live.arrival)?live.arrival:trip.arrival;
 const fresh=!!live&&now-Date.parse(live.checkedAt)<30*60000&&now>=Date.parse(live.checkedAt)-60000;
 return {...trip,departure,arrival,live,fresh,changed:departure!==trip.departure,status:live?.status||'scheduled'};
}
export function nextTransport(trips,snapshot,now){
 const items=trips.map(t=>effectiveTrip(t,snapshot,now));
 for(const trip of items){
  if(trip.status==='arrived'||trip.status==='departed')continue;
  if(trip.status==='cancelled')return {kind:'cancelled',trip};
  if(Date.parse(trip.departure)>now)return {kind:'countdown',trip};
  if(trip.status==='delayed')return {kind:'waiting',trip};
 }
 const last=items.at(-1);
 if(last&&last.status!=='arrived'&&Date.parse(last.arrival)>now)return {kind:'travelling',trip:last};
 return {kind:'finished',trip:last};
}
