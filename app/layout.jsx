import '../styles/globals.css';

export const metadata = {
    title: {
        template: '%s | TenderHub',
        default: 'TenderHub - Система управления тендерами'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body className="antialiased">
                <main>{children}</main>
            </body>
        </html>
    );
}
