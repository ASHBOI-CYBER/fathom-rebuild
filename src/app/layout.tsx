import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, Big_Shoulders_Stencil, Familjen_Grotesk } from 'next/font/google';
import './globals.css';

const shoulders = Big_Shoulders({ variable: '--font-shoulders', subsets: ['latin'], weight: 'variable' });
const stencil = Big_Shoulders_Stencil({ variable: '--font-stencil', subsets: ['latin'], weight: ['800'] });
const familjen = Familjen_Grotesk({ variable: '--font-familjen', subsets: ['latin'] });

const BASE = process.env.BASE_PATH || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://ashboi-cyber.github.io'),
  title: { default: 'Sounding', template: '%s · Sounding' },
  description: 'Meeting recordings you can navigate: who spoke when, what was decided, and the moment it was said.',
  openGraph: { images: [`${BASE}/og.jpg`], siteName: 'Sounding' },
  twitter: { card: 'summary_large_image', images: [`${BASE}/og.jpg`] },
};

export const viewport: Viewport = { themeColor: '#091017' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${shoulders.variable} ${stencil.variable} ${familjen.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
