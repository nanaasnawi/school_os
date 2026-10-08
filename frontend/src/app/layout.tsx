import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { Providers } from './Providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'akselerasi-edu — Platform Manajemen Sekolah',
  description: 'Comprehensive school management platform for the modern era',
  keywords: ['school management', 'education platform', 'akselerasi-edu', 'manajemen sekolah'],
  icons: {
    icon: [
      { url: '/logos/tut_wuri_handayani.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/logos/tut_wuri_handayani.svg',
    apple: '/logos/tut_wuri_handayani.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakarta.variable} ${outfit.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
