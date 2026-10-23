import {site} from './site.mjs';
import {openDB,emailAddress,invite,transaction} from './core.mjs';
import {randomUUID} from 'node:crypto';
const email=emailAddress(process.argv[2]);
const db=openDB(process.env.DB_PATH||site.dbPath);
const owner=db.prepare("SELECT * FROM users WHERE role='owner'").get();
if(owner&&owner.email!==email)throw Error('A different owner already exists');
const value=transaction(db,()=>{const id=owner?.id||randomUUID();if(!owner)db.prepare('INSERT INTO users(id,email,name,role,created_at) VALUES(?,?,?,\'owner\',?)').run(id,email,'Роман',new Date().toISOString());return invite(db,id);});
console.log((process.env.SITE_ORIGIN||site.origin)+'/account/#activate='+value);db.close();
