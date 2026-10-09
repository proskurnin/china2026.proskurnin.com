import {publicPlan,applyRouteUpdates} from './public-plan.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { openDB,digest,token,emailAddress,passwordHash,passwordMatches,passwordValid,publicUser,transaction,invite,youtubeId } from './core.mjs';

export function createApp({dbPath,planPath,origin,tourPath,secure=true}) {
 const db=openDB(dbPath), plan=applyRouteUpdates(JSON.parse(readFileSync(planPath,'utf8'))), publicData=publicPlan(plan);
 const tour=tourPath?JSON.parse(readFileSync(tourPath,'utf8')):null;
 const visitIds=new Set(plan.visits.map(x=>x.id)),checkIds=new Set(plan.checks.map(x=>x.id)),dayIds=new Set(plan.days.map(x=>x.id));
 const cookieName=secure?'__Host-china-session':'china-test-session'; let hashing=0;
 const hashWork=async task=>{if(hashing>=2)throw problem(503,'Вход занят. Повторите через несколько секунд.');hashing++;try{return await task();}finally{hashing--;}};
 const cookie=(value,age=604800)=>`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`;
 const session=(userId,res)=>{const value=token();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(value),userId,Date.now()+604800_000);res.setHeader('Set-Cookie',cookie(value));};
 const state=member=>({revision:db.prepare("SELECT value FROM meta WHERE key='revision'").get().value,checks:member?Object.fromEntries(db.prepare('SELECT * FROM checks').all().map(x=>[x.id,!!x.value])):{},visits:Object.fromEntries(db.prepare('SELECT * FROM visits').all().map(x=>[x.id,x.status]))});
 const current=req=>{const match=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));if(!match)return null;return db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>? AND u.active=1').get(digest(match.slice(cookieName.length+1)),Date.now())||null;};
 const throttle=(key,max=15,period=900000)=>{
  const now=Date.now();db.prepare('DELETE FROM throttle WHERE until<?').run(now);
  const row=db.prepare('SELECT * FROM throttle WHERE key=?').get(key);
  if(row?.count>=max)throw problem(429,'Слишком много попыток. Повторите через 15 минут.');
  db.prepare('INSERT INTO throttle VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+period);
 };
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const requireMember=user=>{if(!user||!['owner','participant'].includes(user.role))throw problem(user?403:401,'Этот раздел доступен владельцу и участникам.');};
 const requireOwner=user=>{if(user?.role!=='owner')throw problem(user?403:401,'Это действие доступно только владельцу.');};
 const server=createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,origin),path=url.pathname,method=req.method,user=current(req),member=!!user&&['owner','participant'].includes(user.role);
   if(!path.startsWith('/api/account/')&&!path.startsWith('/api/trip/'))throw problem(404,'Страница не найдена.');
   const mutating=!['GET','HEAD'].includes(method);
   let body={};
   if(mutating){
    if(req.headers.origin!==origin)throw problem(403,'Запрос должен быть отправлен с сайта.');
    if(!String(req.headers['content-type']||'').startsWith('application/json'))throw problem(415,'Нужен JSON.');
    let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>(path.startsWith('/api/trip/storage')?16*1024*1024:65536))throw problem(413,'Слишком большой запрос.');parts.push(chunk);}
    try{body=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw problem(400,'Не удалось прочитать запрос.');}
    if(!body||typeof body!=='object'||Array.isArray(body))throw problem(400,'Некорректные данные.');
   }
   const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',').at(-1).trim();
   if(path==='/api/trip/tour'&&method==='GET'){requireMember(user);return send(res,200,{prices:tour?.prices||[],questions:tour?.questions||[]});}
   if(path==='/api/account/me'&&method==='GET')return send(res,200,{user:publicUser(user)});
   if(path==='/api/account/login'&&method==='POST'){
    throttle('login-ip:'+ip,30);const email=emailAddress(body.email);throttle('login-email:'+digest(email),12);
    const account=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const correct=await hashWork(()=>passwordMatches(body.password,account?.password));
    if(!correct||!account?.active)throw problem(401,'Неверный email или пароль.');
    db.prepare('DELETE FROM throttle WHERE key=?').run('login-email:'+digest(email));
    session(account.id,res);return send(res,200,{user:publicUser(account)});
   }
   if(path==='/api/account/logout'&&method==='POST'){
    const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));
    if(value)db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(value.slice(cookieName.length+1)));
    res.setHeader('Set-Cookie',cookie('',0));return send(res,200,{ok:true});
   }
   if(['/api/account/activation-info','/api/account/activate'].includes(path)&&method==='POST'){
    throttle('activation:'+ip,30);
    if(typeof body.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.token))throw problem(400,'Ссылка недействительна или истекла.');
    const invitation=db.prepare('SELECT i.*,u.email,u.name,u.active FROM invitations i JOIN users u ON u.id=i.user_id WHERE i.hash=? AND i.expires>? AND u.active=1').get(digest(body.token),Date.now());
    if(!invitation)throw problem(400,'Ссылка недействительна или истекла.');
    if(path.endsWith('activation-info'))return send(res,200,{email:invitation.email,name:invitation.name});
    const hash=await hashWork(()=>passwordHash(body.password));
    transaction(db,()=>{
     if(!db.prepare('SELECT id FROM users WHERE id=? AND active=1').get(invitation.user_id))throw problem(400,'Доступ к аккаунту отключён.');
     const valid=db.prepare('DELETE FROM invitations WHERE hash=? AND expires>?').run(digest(body.token),Date.now());
     if(!valid.changes)throw problem(400,'Ссылка уже использована.');
     db.prepare('UPDATE users SET password=? WHERE id=? AND active=1').run(hash,invitation.user_id);
     db.prepare('DELETE FROM sessions WHERE user_id=?').run(invitation.user_id);
    });
    const account=db.prepare('SELECT * FROM users WHERE id=?').get(invitation.user_id);session(account.id,res);return send(res,200,{user:publicUser(account)});
   }
   if(path==='/api/account/password'&&method==='POST'){
    if(!user)throw problem(401,'Войдите на сайт.');throttle('password:'+user.id,8);
    if(!await hashWork(()=>passwordMatches(body.currentPassword,user.password)))throw problem(400,'Текущий пароль неверен.');
    const hash=await hashWork(()=>passwordHash(body.password));
    transaction(db,()=>{db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);});
    session(user.id,res);return send(res,200,{ok:true});
   }
   if(path==='/api/account/users'){
    requireOwner(user);
    if(method==='GET')return send(res,200,{users:db.prepare('SELECT id,email,name,role,active,password IS NOT NULL as registered FROM users ORDER BY created_at').all()});
    if(method==='POST'){
     const email=emailAddress(body.email);if(!['participant','viewer'].includes(body.role))throw problem(400,'Выберите роль участника или зрителя.');
     if(db.prepare('SELECT id FROM users WHERE email=?').get(email))throw problem(409,'Этот email уже добавлен.');
     const id=randomUUID(),name=typeof body.name==='string'?body.name.trim().slice(0,80):'';
     const value=transaction(db,()=>{db.prepare('INSERT INTO users(id,email,name,role,created_at) VALUES(?,?,?,?,?)').run(id,email,name,body.role,new Date().toISOString());return invite(db,id);});
     return send(res,201,{url:origin+'/account/#activate='+value});
    }
   }
   if(path.startsWith('/api/account/users/')&&method==='PATCH'){
    requireOwner(user);const id=path.split('/').at(-1),account=db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if(!account)throw problem(404,'Пользователь не найден.');if(account.role==='owner')throw problem(400,'Роль и доступ владельца нельзя изменить здесь.');
    if(body.action==='reset') { const value=invite(db,id);return send(res,200,{url:origin+'/account/#activate='+value}); }
    if(!['participant','viewer'].includes(body.role)||typeof body.active!=='boolean')throw problem(400,'Некорректная роль или статус.');
    transaction(db,()=>{db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(body.role,+body.active,id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);if(!body.active)db.prepare('DELETE FROM invitations WHERE user_id=?').run(id);});
    return send(res,200,{ok:true});
   }
   if(['/api/trip/storage','/api/trip/storage/import','/api/trip/storage/archive'].includes(path)){
    requireMember(user);
    const ownerKeys=['plan','history','base-version','draft'];
    const permitted=key=>['personal','logistics','map-provider','preferences',...ownerKeys].includes(key)&&(!ownerKeys.includes(key)||user.role==='owner');
    if(path.endsWith('/archive')&&method==='GET')return send(res,200,{archives:db.prepare('SELECT key,value,created_at AS createdAt FROM personal_archive WHERE user_id=?').all(user.id)});
    const read=key=>db.prepare('SELECT value,revision FROM personal_storage WHERE user_id=? AND key=?').get(user.id,key);
    if(method==='GET'&&path==='/api/trip/storage')return send(res,200,{userId:user.id,items:Object.fromEntries(db.prepare('SELECT key,value,revision FROM personal_storage WHERE user_id=?').all(user.id).filter(r=>permitted(r.key)).map(r=>[r.key,{value:r.value,revision:r.revision}]))});
    if((method==='PUT'&&path==='/api/trip/storage')||(method==='POST'&&path.endsWith('/import'))){
     const {key,value,revision}=body;
     if(body.accountId!==user.id)throw problem(409,'Учётная запись изменилась. Обновите страницу.');
     if(!permitted(key))throw problem(403,'Эти данные недоступны для вашей роли.');
     if(typeof value!=='string'||Buffer.byteLength(value)>12*1024*1024)throw problem(400,'Некорректный размер данных.');
     if(key==='map-provider'){if(!['google','osm'].includes(value))throw problem(400,'Неизвестная карта.');}
     else if(key==='draft'){if(value.length>2000000)throw problem(400,'Черновик больше 2 МБ.');}
     else if(key==='base-version'){if(value.length>100)throw problem(400,'Некорректная версия.');}
     else {
      let parsed;try{parsed=JSON.parse(value);}catch{throw problem(400,'Некорректный JSON.');}
      if(!parsed||typeof parsed!=='object')throw problem(400,'Нужен объект данных.');
      if(key==='personal'){
       if(!parsed.visits||typeof parsed.visits!=='object'||Array.isArray(parsed.visits)||!parsed.checks||typeof parsed.checks!=='object')throw problem(400,'Некорректные личные отметки.');
       for(const [id,v] of Object.entries(parsed.visits)){
        if(id.length>200||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['note','favorite','start','end','price','status'].includes(k)))throw problem(400,'Некорректная запись места.');
        if(v.note!==undefined&&(typeof v.note!=='string'||v.note.length>20000))throw problem(400,'Заметка слишком длинная.');
        if(v.favorite!==undefined&&typeof v.favorite!=='boolean')throw problem(400,'Некорректное избранное.');
        for(const k of ['start','end'])if(v[k]!==undefined&&v[k]!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v[k]))throw problem(400,'Некорректное время.');
        if(v.price!==undefined&&v.price!==null&&(!Number.isFinite(v.price)||v.price<0))throw problem(400,'Некорректная цена.');
        if(user.role!=='owner'&&['start','end','price','status'].some(k=>k in v))throw problem(403,'Время, цену и общие отметки изменяет владелец.');
       }
      }
      if(key==='logistics'&&(!parsed.modes||!parsed.addresses))throw problem(400,'Некорректные настройки маршрутов.');
      if(key==='history'&&(!Array.isArray(parsed)||parsed.length>5))throw problem(400,'Допускается пять версий плана.');
      if(key==='plan'&&(!Array.isArray(parsed.days)||!Array.isArray(parsed.visits)||!Array.isArray(parsed.places)))throw problem(400,'Некорректный план.');
     }
     const row=transaction(db,()=>{
      const current=read(key);
      if(path.endsWith('/import')){
       db.prepare('INSERT OR IGNORE INTO personal_archive VALUES(?,?,?,?,?)').run(user.id,key,digest(value),value,new Date().toISOString());
       if(current)return current;
      }else if(!Number.isSafeInteger(revision)||revision!==(current?.revision||0))throw problem(409,'Данные изменены на другом устройстве. Скачайте резервную копию текущих правок и обновите страницу.');
      db.prepare('INSERT INTO personal_storage VALUES(?,?,?,1) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value,revision=personal_storage.revision+1').run(user.id,key,value);
      return read(key);
     });return send(res,200,{row});
    }
   }
   if(path==='/api/trip/plan'&&method==='GET')return send(res,200,{plan:member?plan:publicData});
   if(path==='/api/trip/state'&&method==='GET')return send(res,200,state(member));
   if(path==='/api/trip/state'&&method==='PATCH'){
    requireOwner(user);
    const {kind,id,value}=body;
    if(kind==='check'&&checkIds.has(id)&&typeof value==='boolean')db.prepare('INSERT INTO checks VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(id,+value);
    else if(kind==='visit'&&visitIds.has(id)&&['planned','booked','visited','skip'].includes(value))db.prepare('INSERT INTO visits VALUES(?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status').run(id,value);
    else throw problem(400,'Некорректная отметка.');
    db.prepare("UPDATE meta SET value=value+1 WHERE key='revision'").run();return send(res,200,state(true));
   }
   if(path==='/api/trip/import-marks'&&method==='POST'){
    requireOwner(user);const checks=body.checks||{},visits=body.visits||{};
    if(Array.isArray(checks)||Array.isArray(visits)||typeof checks!=='object'||typeof visits!=='object')throw problem(400,'Некорректные отметки.');
    transaction(db,()=>{
     if(state(true).revision!==0)throw problem(409,'Общий список уже изменён. Перенос не выполнен.');
     for(const [id,value] of Object.entries(checks))if(checkIds.has(id)&&typeof value==='boolean')db.prepare('INSERT INTO checks VALUES(?,?)').run(id,+value);
     for(const [id,item] of Object.entries(visits))if(visitIds.has(id)&&['planned','booked','visited','skip'].includes(item?.status))db.prepare('INSERT INTO visits VALUES(?,?)').run(id,item.status);
     db.prepare("UPDATE meta SET value=value+1 WHERE key='revision'").run();
    });return send(res,200,state(true));
   }
   if(path==='/api/trip/videos'&&method==='GET')return send(res,200,{videos:db.prepare('SELECT id,video_id AS videoId,title,day_id AS dayId,created_at AS createdAt FROM videos WHERE deleted=0 ORDER BY day_id IS NULL,day_id,created_at').all()});
   if(path==='/api/trip/videos'&&method==='POST'){
    requireOwner(user);const videoId=youtubeId(body.url),title=typeof body.title==='string'?body.title.trim():'';
    if(!videoId||!title||title.length>160||(body.dayId&&!dayIds.has(body.dayId)))throw problem(400,'Укажите ссылку YouTube, название до 160 символов и день поездки.');
    const existing=db.prepare('SELECT * FROM videos WHERE video_id=?').get(videoId);if(existing&&!existing.deleted)throw problem(409,'Это видео уже добавлено.');
    if(existing)db.prepare('UPDATE videos SET deleted=0,title=?,day_id=? WHERE id=?').run(title,body.dayId||null,existing.id);
    else db.prepare('INSERT INTO videos(id,video_id,title,day_id,created_at) VALUES(?,?,?,?,?)').run(randomUUID(),videoId,title,body.dayId||null,new Date().toISOString());
    return send(res,201,{ok:true});
   }
   if(path.startsWith('/api/trip/videos/')&&['PATCH','DELETE'].includes(method)){
    requireOwner(user);const id=path.split('/').at(-1);if(!db.prepare('SELECT id FROM videos WHERE id=? AND deleted=0').get(id))throw problem(404,'Видео не найдено.');
    if(method==='DELETE')db.prepare('UPDATE videos SET deleted=1 WHERE id=?').run(id);
    else {const title=typeof body.title==='string'?body.title.trim():'';if(!title||title.length>160||(body.dayId&&!dayIds.has(body.dayId)))throw problem(400,'Проверьте название и день.');db.prepare('UPDATE videos SET title=?,day_id=? WHERE id=?').run(title,body.dayId||null,id);}
    return send(res,200,{ok:true});
   }
   throw problem(404,'Запрос не найден.');
  }catch(error){const status=error.status||(/email|Пароль/.test(error.message)?400:500);if(status===500)console.error('Account API error:',error.code||error.name);if(!res.headersSent)send(res,status,{error:status===500?'Не удалось сохранить данные. Повторите попытку.':error.message});else res.end();}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 const cleanup=setInterval(()=>{db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('DELETE FROM invitations WHERE expires<?').run(Date.now());},3600000);cleanup.unref();
 server.on('close',()=>{clearInterval(cleanup);db.close();});return server;
}
function problem(status,message){return Object.assign(new Error(message),{status});}
