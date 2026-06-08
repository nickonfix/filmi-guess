import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-display' });

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://filmi-guess.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'FilmiGuess — Bollywood & Indian Cinema Quiz Game',
    template: '%s | FilmiGuess',
  },
  description:
    'Free real-time multiplayer quiz game. Guess Bollywood actors, Hindi movies, South Indian stars and classic films with friends. No signup needed — create a room and play instantly!',
  keywords: [
    'bollywood quiz game',
    'indian cinema quiz',
    'guess the bollywood actor',
    'hindi movie quiz online',
    'south indian actor quiz',
    'multiplayer bollywood game',
    'filmi guess',
    'free bollywood game',
    'online movie quiz india',
    'jklm bollywood',
  ],
  authors: [{ name: 'FilmiGuess' }],
  creator: 'FilmiGuess',
  openGraph: {
    type: 'website',
    url: BASE,
    siteName: 'FilmiGuess',
    title: 'FilmiGuess — Bollywood & Indian Cinema Quiz Game',
    description:
      'Guess Bollywood actors, Hindi movies and South Indian stars with friends in real time. Free, no signup, up to 50 players!',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FilmiGuess — Bollywood Quiz with Friends',
    description: 'Free real-time multiplayer Indian cinema guessing game. No signup needed!',
    creator: '@filmi_guess',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: BASE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FilmiGuess',
    url: BASE,
    description:
      'Free multiplayer Indian cinema quiz game. Guess Bollywood actors, Hindi movies and South Indian stars with friends.',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    inLanguage: 'en',
    audience: { '@type': 'Audience', audienceType: 'Indian cinema fans' },
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
