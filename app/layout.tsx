import type {Metadata} from 'next';
import './globals.css';
import {site} from '@/lib/site';
export const metadata:Metadata={title:site.title,description:site.description,icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
 return <html lang="ru">{site.fonts?<head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="stylesheet" href={site.fonts}/></head>:null}<body>{children}</body></html>;
}
