export type User={id:string;email:string;name:string;role:'owner'|'participant'|'viewer'};
export type SharedState={revision:number;checks:Record<string,boolean>;visits:Record<string,string>};
export const roleLabels={owner:'Владелец',participant:'Участник',viewer:'Зритель'};
export async function api<T=any>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 let data:any;try{data=await response.json()}catch{throw Error('Сервис временно недоступен. Повторите попытку.');}
 if(!response.ok)throw Error(data.error||'Не удалось выполнить действие.');return data;
}
