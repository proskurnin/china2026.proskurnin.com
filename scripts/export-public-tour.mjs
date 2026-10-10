import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
const {prices,questions,packing,flightCost,tourPayment,...tour}=JSON.parse(readFileSync('data/tour.json','utf8'));
writeFileSync('data/public-tour.json',JSON.stringify(tour,null,2)+'\n');
// Vinext exports /account as account.html; Apache serves directory indexes.
if(process.argv.includes('--apache')&&existsSync('dist/client/account.html')){
 mkdirSync('dist/client/account',{recursive:true});
 copyFileSync('dist/client/account.html','dist/client/account/index.html');
}
