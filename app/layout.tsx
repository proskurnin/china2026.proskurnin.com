import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Китай 2026 — наше путешествие',description:'План путешествия по Китаю: маршрут, расписание, бюджет и подготовка.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ru"><body>{children}</body></html>}
