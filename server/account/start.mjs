import {createApp} from './app.mjs';
import {site} from './site.mjs';
const origin=process.env.SITE_ORIGIN||site.origin;
createApp({dbPath:process.env.DB_PATH||site.dbPath,planPath:process.env.PLAN_PATH||'/app/plan.json',tourPath:process.env.TOUR_PATH||'/app/tour.json',origin,secure:!origin.startsWith('http://127.0.0.1:')}).listen(Number(process.env.PORT||site.port),process.env.BIND_HOST||'0.0.0.0',()=>console.log(site.id+' account service ready'));
