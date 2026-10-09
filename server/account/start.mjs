import {createApp} from './app.mjs';
const origin=process.env.SITE_ORIGIN||'https://china2026.proskurnin.com';
createApp({dbPath:process.env.DB_PATH||'/data/china.sqlite',planPath:process.env.PLAN_PATH||'/app/plan.json',tourPath:process.env.TOUR_PATH||'/app/tour.json',origin,secure:!origin.startsWith('http://127.0.0.1:')}).listen(Number(process.env.PORT||3221),process.env.BIND_HOST||'0.0.0.0',()=>console.log('China account service ready'));
