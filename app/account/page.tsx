import Account from './account';
import {site} from '@/lib/site';
export const metadata={title:`Вход и пользователи — ${site.name} ${site.year}`,robots:{index:false,follow:false}};
export default function AccountPage(){return <Account/>;}
