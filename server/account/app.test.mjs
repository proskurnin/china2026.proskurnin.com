import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {openDB,invite} from './core.mjs';
import {createApp} from './app.mjs';
import {applyRouteUpdates} from './public-plan.mjs';

test('Roles, sessions, invitations, protected data and owner-only writes',async()=>{
 const sourcePlan={...JSON.parse(readFileSync('data/plan.json','utf8')),days:[{id:'day-1',sourceText:'Private'}],checks:[{id:'check-1'}],visits:[{id:'visit-1',description:'Public',source:'Private'}],expenses:[{id:'expense-1',amount:100}]};
 const dir=mkdtempSync(join(tmpdir(),'china-auth-test-')),dbPath=join(dir,'test.sqlite');
 const planPath=join(dir,'plan.json');writeFileSync(planPath,JSON.stringify(sourcePlan));
 const tourPath=resolve('data/tour.json');
 const db=openDB(dbPath);db.prepare("INSERT INTO users(id,email,name,role,created_at) VALUES('owner','owner@example.test','Owner','owner',?)").run(new Date().toISOString());
 const ownerToken=invite(db,'owner');db.close();
 const origin='http://127.0.0.1:18929',app=createApp({dbPath,planPath,tourPath,origin,secure:false});await new Promise(r=>app.listen(18929,'127.0.0.1',r));
 const request=async(path,{method='GET',body,cookie='',site=origin}={})=>{const res=await fetch(origin+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:site}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};
 try {
  assert.equal((await request('/api/trip/tour')).status,401);
  let r=await request('/api/trip/plan');assert.equal(r.status,200);assert.equal(r.data.plan.expenses.length,0);assert.equal(r.data.plan.checks.length,0);assert.equal(r.data.plan.sourceDocument,'');assert.ok(r.data.plan.days.every(d=>!d.sourceText));assert.equal(r.data.plan.execution?.events,undefined);assert.equal(r.data.plan.execution?.expenses,undefined);
  for(const [path,method,body]of [['/api/trip/state','PATCH',{kind:'check',id:'x',value:true}],['/api/trip/videos','POST',{}],['/api/account/users','POST',{}]])assert.equal((await request(path,{method,body})).status,401);
  r=await request('/api/account/activate',{method:'POST',body:{token:ownerToken,password:'Owner secure phrase 2026'}});assert.equal(r.status,200);const owner=r.cookie;
  assert.equal((await request('/api/account/activate',{method:'POST',body:{token:ownerToken,password:'Another secure phrase'}})).status,400);
  r=await request('/api/trip/plan',{cookie:owner});assert.equal(r.data.plan.expenses.length,sourcePlan.expenses.length);assert.equal(r.data.plan.checks.length,sourcePlan.checks.length);const checkId=r.data.plan.checks[0].id,visitId=r.data.plan.visits[0].id,dayId=r.data.plan.days[0].id;
  assert.equal((await request('/api/account/users',{method:'POST',cookie:owner,site:'https://evil.example',body:{email:'evil@example.test',role:'owner'}})).status,403);
  assert.equal((await request('/api/account/users',{method:'POST',cookie:owner,body:{email:'evil@example.test',role:'owner'}})).status,400);
  const cookies={};const ids={};
  for(const role of ['participant','viewer']){
   r=await request('/api/account/users',{method:'POST',cookie:owner,body:{email:role+'@example.test',role,name:role}});assert.equal(r.status,201);
   const t=new URL(r.data.url).hash.slice('#activate='.length);
   r=await request('/api/account/activate',{method:'POST',body:{token:t,password:'Member secure phrase 2026'}});assert.equal(r.status,200);cookies[role]=r.cookie;ids[role]=r.data.user.id;
   for(const [path,method,body]of [['/api/trip/state','PATCH',{kind:'check',id:checkId,value:true}],['/api/trip/videos','POST',{url:'https://youtu.be/M7lc1UVf-VE',title:'Test'}],['/api/account/users','POST',{email:'x@y.test',role:'participant'}],['/api/trip/import-marks','POST',{checks:{}}]])assert.equal((await request(path,{method,body,cookie:r.cookie})).status,403);
  }
  assert.equal((await request('/api/trip/tour',{cookie:cookies.viewer})).status,403);
  assert.deepEqual((await request('/api/trip/tour',{cookie:cookies.participant})).data.prices,JSON.parse(readFileSync(tourPath,'utf8')).prices);
  // Personal data belongs to the signed-in account and survives service restarts.
  assert.equal((await request('/api/trip/storage')).status,401);
  assert.equal((await request('/api/trip/storage',{cookie:cookies.viewer})).status,403);
  const personal=JSON.stringify({visits:{[visitId]:{note:'Owner note',favorite:true}},checks:{}});
  let saved=await request('/api/trip/storage',{method:'PUT',cookie:owner,body:{key:'personal',value:personal,revision:0,accountId:'owner'}});
  assert.equal(saved.status,200);assert.equal(saved.data.row.revision,1);
  assert.equal((await request('/api/trip/storage',{cookie:cookies.participant})).data.items.personal,undefined);
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:owner,body:{key:'personal',value:personal,revision:0,accountId:'owner'}})).status,409);
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:owner,site:'https://evil.example',body:{key:'personal',value:personal,revision:1,accountId:'owner'}})).status,403);
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:cookies.participant,body:{key:'personal',value:personal,revision:0,accountId:'owner'}})).status,409);
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:cookies.participant,body:{key:'plan',value:JSON.stringify(sourcePlan),revision:0,accountId:ids.participant}})).status,403);
  // Content drafts use existing private preferences storage without publishing them.
  const contentPreferences=JSON.stringify({currency:'EUR',contentStudio:{version:1,items:[{id:'story-1',title:'Family album',format:'album',stage:'select',dayId,source:'https://example.test/folder',link:'',notes:'Private selection'}]}});
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:owner,body:{key:'preferences',value:contentPreferences,revision:0,accountId:'owner'}})).status,200);
  assert.equal((await request('/api/trip/storage',{cookie:owner})).data.items.preferences.value,contentPreferences);
  assert.equal((await request('/api/trip/storage',{cookie:cookies.participant})).data.items.preferences,undefined);
  assert.equal((await request('/api/trip/storage',{method:'PUT',cookie:cookies.viewer,body:{key:'preferences',value:contentPreferences,revision:0,accountId:ids.viewer}})).status,403);
  const legacy=JSON.stringify({visits:{[visitId]:{note:'Old device note'}},checks:{}});
  saved=await request('/api/trip/storage/import',{method:'POST',cookie:owner,body:{key:'personal',value:legacy,accountId:'owner'}});
  assert.equal(saved.status,200);assert.equal(saved.data.row.value,personal);
  await request('/api/trip/storage/import',{method:'POST',cookie:owner,body:{key:'personal',value:legacy,accountId:'owner'}});
  assert.equal((await request('/api/trip/storage/archive',{cookie:owner})).data.archives.length,1);
  assert.equal((await request('/api/trip/storage/archive',{cookie:cookies.participant})).data.archives.length,0);
  const second=createApp({dbPath,planPath,tourPath,origin,secure:false});
  await new Promise(r=>second.listen(18930,'127.0.0.1',r));
  try{const data=await(await fetch('http://127.0.0.1:18930/api/trip/storage',{headers:{Cookie:owner}})).json();assert.equal(data.items.personal.value,personal);}finally{await new Promise(r=>second.close(r));}
  assert.equal((await request('/api/trip/plan',{cookie:cookies.participant})).data.plan.expenses.length,sourcePlan.expenses.length);
  assert.equal((await request('/api/trip/plan',{cookie:cookies.viewer})).data.plan.expenses.length,0);assert.equal((await request('/api/trip/plan',{cookie:cookies.viewer})).data.plan.execution?.events,undefined);assert.deepEqual((await request('/api/trip/plan',{cookie:cookies.participant})).data.plan.execution,sourcePlan.execution);
  r=await request('/api/trip/import-marks',{method:'POST',cookie:owner,body:{checks:{[checkId]:true},visits:{[visitId]:{status:'visited'}}}});assert.equal(r.status,200);assert.equal(r.data.checks[checkId],true);
  assert.equal((await request('/api/trip/import-marks',{method:'POST',cookie:owner,body:{checks:{}}})).status,409);
  r=await request('/api/trip/state',{cookie:cookies.viewer});assert.deepEqual(r.data.checks,{});assert.equal(r.data.visits[visitId],'visited');
  r=await request('/api/trip/state',{method:'PATCH',cookie:owner,body:{kind:'check',id:checkId,value:false}});assert.equal(r.data.checks[checkId],false);
  assert.equal((await request('/api/trip/state',{method:'PATCH',cookie:owner,body:{kind:'check',id:'unknown',value:true}})).status,400);
  r=await request('/api/trip/videos',{method:'POST',cookie:owner,body:{url:'https://youtu.be/M7lc1UVf-VE',title:'Test',dayId}});assert.equal(r.status,201);
  assert.equal((await request('/api/trip/videos',{method:'POST',cookie:owner,body:{url:'https://evil.test/watch?v=M7lc1UVf-VE',title:'Test'}})).status,400);
  assert.equal((await request('/api/trip/videos',{method:'POST',cookie:owner,body:{url:'https://youtu.be/M7lc1UVf-VE',title:'Test'}})).status,409);
  r=await request('/api/trip/videos');assert.equal(r.data.videos.length,1);const videoId=r.data.videos[0].id;
  assert.equal((await request('/api/trip/videos/'+videoId,{method:'DELETE',cookie:cookies.participant,body:{}})).status,403);
  assert.equal((await request('/api/trip/videos/'+videoId,{method:'PATCH',cookie:owner,body:{title:'Edited',dayId:null}})).status,200);
  assert.equal((await request('/api/trip/videos/'+videoId,{method:'DELETE',cookie:owner,body:{}})).status,200);
  assert.equal((await request('/api/trip/videos')).data.videos.length,0);
  assert.equal((await request('/api/account/users/'+ids.participant,{method:'PATCH',cookie:owner,body:{role:'viewer',active:true}})).status,200);
  assert.equal((await request('/api/account/me',{cookie:cookies.participant})).data.user,null);
  r=await request('/api/account/login',{method:'POST',body:{email:'participant@example.test',password:'Member secure phrase 2026'}});assert.equal(r.data.user.role,'viewer');
  assert.equal((await request('/api/trip/plan',{cookie:r.cookie})).data.plan.expenses.length,0);
  assert.equal((await request('/api/account/users/owner',{method:'PATCH',cookie:owner,body:{role:'viewer',active:false}})).status,400);
  r=await request('/api/account/password',{method:'POST',cookie:owner,body:{currentPassword:'Owner secure phrase 2026',password:'New owner secure phrase'}});assert.equal(r.status,200);const newOwner=r.cookie;
  assert.equal((await request('/api/account/me',{cookie:owner})).data.user,null);
  assert.equal((await request('/api/account/logout',{method:'POST',cookie:newOwner,body:{}})).status,200);
  assert.equal((await request('/api/account/me',{cookie:newOwner})).data.user,null);
  assert.equal((await request('/api/account/login',{method:'POST',body:{email:'owner@example.test',password:'bad'}})).status,401);
 }finally{await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});}
});

test('Secure cookies, expiry, revocation and login throttling',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'china-auth-security-')),dbPath=join(dir,'test.sqlite');
 const db=openDB(dbPath);db.prepare("INSERT INTO users(id,email,name,role,created_at) VALUES('owner','owner@example.test','Owner','owner',?)").run(new Date().toISOString());
 let token=invite(db,'owner');
 const site='https://china2026.proskurnin.com';
 const app=createApp({dbPath,planPath:resolve('data/plan.json'),origin:site,secure:true});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+app.address().port;
 const post=async(path,body,cookie='')=>fetch(base+path,{method:'POST',headers:{Origin:site,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 try{
  db.prepare('UPDATE invitations SET expires=0').run();
  assert.equal((await post('/api/account/activate',{token,password:'Owner secure phrase 2026'})).status,400);
  token=invite(db,'owner');
  const activated=await post('/api/account/activate',{token,password:'Owner secure phrase 2026'});
  assert.equal(activated.status,200);
  const cookie=activated.headers.get('set-cookie');
  assert.match(cookie,/^__Host-china-session=/);assert.match(cookie,/; Secure/);assert.match(cookie,/; HttpOnly/);assert.match(cookie,/; SameSite=Lax/);assert.match(cookie,/; Path=\//);assert.doesNotMatch(cookie,/Domain=/i);
  const getMe=()=>fetch(base+'/api/account/me',{headers:{Cookie:cookie.split(';')[0]}}).then(r=>r.json());
  assert.equal((await getMe()).user.id,'owner');
  db.prepare('UPDATE users SET active=0').run();assert.equal((await getMe()).user,null);
  db.prepare('UPDATE users SET active=1').run();db.prepare('UPDATE sessions SET expires=0').run();assert.equal((await getMe()).user,null);
  for(let i=0;i<12;i++)assert.equal((await post('/api/account/login',{email:'nobody@example.test',password:'bad'})).status,401);
  assert.equal((await post('/api/account/login',{email:'nobody@example.test',password:'bad'})).status,429);
 }finally{db.close();await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});}
});
