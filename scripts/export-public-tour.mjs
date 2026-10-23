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
