import type { Metadata, Viewport } from 'next';
import { Newsreader, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';

const grotesk = Schibsted_Grotesk({ variable: '--font-grotesk', subsets: ['latin'] });
const newsreader = Newsreader({ variable: '--font-newsreader', subsets: ['latin'], style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: { default: 'Sounding', template: '%s · Sounding' },
  description: 'Meeting recordings you can actually navigate — transcripts, notes, decisions and clips.',
};

export const viewport: Viewport = { themeColor: '#eef3f4' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
