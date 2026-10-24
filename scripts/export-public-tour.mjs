import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
const {prices,questions,flightCost,tourPayment,packing,...tour}=JSON.parse(readFileSync('data/tour.json','utf8'));
// The packing list is private («Подготовка», /api/trip/tour); power bank rules stay public («Полезно»).
tour.powerbank=packing?.powerbank??null;
// Ticket-confirmed public flight schedule; leave private source data untouched.
for(const day of tour.days){
 day.items=day.items.map(item=>item
  .replace('Прилёт рейсом 3U3888 в 11:35 по программе; трансфер в отель.','Прилёт 27 октября рейсом 3U3888 в Чэнду Тяньфу (TFU) в 10:25 по билету, время китайское; трансфер в отель.')
  .replace('Рейс 3U3887: вылет в 16:50, прибытие в Москву в 20:20 по программе.','Рейс 3U3887 2 ноября: вылет из Чэнду Тяньфу (TFU), терминал 1, в 16:45 по Китаю; прибытие в Шереметьево (SVO), терминал C, в 20:00 МСК по билету.'));
}
writeFileSync('data/public-tour.json',JSON.stringify(tour,null,2)+'\n');
// Vinext exports /account as account.html; Apache serves directory indexes.
if(process.argv.includes('--apache')&&existsSync('dist/client/account.html')){
 mkdirSync('dist/client/account',{recursive:true});
 copyFileSync('dist/client/account.html','dist/client/account/index.html');
}

// Materialize clean attraction URLs for Apache and require all pages in the bundle.
if(process.argv.includes('--apache')){
 const places=JSON.parse(readFileSync('data/tour-places.json','utf8'));
 for(const place of places){
  const base='dist/client/places/'+place.id;
  if(existsSync(base+'.html')){mkdirSync(base,{recursive:true});copyFileSync(base+'.html',base+'/index.html');}
  if(!existsSync(base+'/index.html'))throw new Error('Missing exported attraction page: '+place.id);
  const html=readFileSync(base+'/index.html','utf8');
  if(!html.includes(place.chinese)||!(html.includes('youtube.com/watch') || html.includes('youtu.be/')))throw new Error('Incomplete attraction page: '+place.id);
 }
 console.log('Verified '+places.length+' exported attraction pages with descriptions and video links');
}
