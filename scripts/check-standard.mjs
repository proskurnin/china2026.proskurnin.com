// Travel-site standard check (shared file, see AGENTS.md «Стандарт сайтов путешествий»).
// Shared files must be byte-identical in every travel-site repository; travel-standard.json holds their hashes.
//   node scripts/check-standard.mjs           verify (part of npm run check)
//   node scripts/check-standard.mjs --update  recompute after an intended change of the standard,
//                                             then copy the same files and travel-standard.json to all travel-site repos
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
const manifestPath='travel-standard.json';
const required=['.github/workflows/deploy.yml','.nvmrc','scripts/check-standard.mjs','CLAUDE.md',
 'server/account/app.mjs','server/account/core.mjs','server/account/owner-invite.mjs','server/account/start.mjs','server/account/app.test.mjs',
 'app/account/account.tsx','app/account/account.css','app/account/page.tsx','app/layout.tsx','lib/account-client.ts'];
// Shared when present: sites on the old planner interface (Europe) have no checklist / atlas map.
const optional=['app/tour-preparation.tsx','app/tour-google-map.tsx','app/tour-osm-map.tsx'];
const hash=text=>createHash('sha256').update(text).digest('hex');
const agentsBlock=()=>{const s=readFileSync('AGENTS.md','utf8'),m=s.match(/<!-- travel-standard:start[\s\S]*?<!-- travel-standard:end -->/);if(!m)throw Error('AGENTS.md: раздел стандарта (travel-standard:start … end) не найден');return m[0];};
const current=()=>({
 files:Object.fromEntries(required.map(f=>[f,existsSync(f)?hash(readFileSync(f)):null])),
 optional:Object.fromEntries(optional.filter(f=>existsSync(f)).map(f=>[f,hash(readFileSync(f))])),
 agents:hash(agentsBlock()),
});
if(process.argv.includes('--update')){
 const old=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{};
 const now=current(),version=(agentsBlock().match(/версия ([\d.]+)/)||[])[1]||old.version||'?';
 const missing=Object.entries(now.files).filter(([,h])=>!h).map(([f])=>f);
 if(missing.length){console.error('Нет общих файлов: '+missing.join(', '));process.exit(1);}
 const optionalHashes={...(old.optional||{}),...now.optional};
 writeFileSync(manifestPath,JSON.stringify({standard:'travel-sites',version,files:now.files,optional:optionalHashes,agents:now.agents},null,2)+'\n');
 console.log(`travel-standard.json обновлён (версия ${version}). Перенесите общие файлы и travel-standard.json во все репозитории сайтов путешествий.`);
 process.exit(0);
}
const manifest=JSON.parse(readFileSync(manifestPath,'utf8')),now=current(),problems=[];
for(const [f,h] of Object.entries(manifest.files))if(now.files[f]!==h)problems.push(now.files[f]?`изменён ${f}`:`нет файла ${f}`);
for(const [f,h] of Object.entries(manifest.optional||{}))if(existsSync(f)&&now.optional[f]!==h)problems.push(`изменён ${f}`);
if(now.agents!==manifest.agents)problems.push('изменён раздел «Стандарт сайтов путешествий» в AGENTS.md');
if(problems.length){
 console.error('Стандарт сайтов путешествий нарушен:\n - '+problems.join('\n - ')+
  '\nОбщие файлы одинаковы во всех сайтах. Если изменение намеренное — сделайте его во всех репозиториях сайтов путешествий и выполните node scripts/check-standard.mjs --update (см. AGENTS.md «Как менять стандарт»).');
 process.exit(1);
}
console.log(`Стандарт сайтов путешествий ${manifest.version}: общие файлы совпадают.`);
