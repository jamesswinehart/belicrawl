import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beli Crawl',
  description: 'Plan a walking food crawl in a few clicks',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Beli Crawl',
    description: 'Plan a walking food crawl in a few clicks',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 1200,
        alt: 'Beli Crawl',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beli Crawl',
    description: 'Plan a walking food crawl in a few clicks',
    images: ['/og-image.svg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Beli Crawl',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // For safe area insets (iPhone notches)
  themeColor: '#00505E', // Beli teal
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

